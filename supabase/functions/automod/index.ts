import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, messageId } = await req.json();
    
    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ allowed: true, reason: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AI to moderate the message
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a chat moderation AI. Analyze messages for:
1. Hate speech, slurs, or discriminatory language
2. Explicit threats or harassment
3. Spam or repeated nonsense
4. Excessive profanity
5. Attempts to share personal information or doxxing
6. Links to malicious/phishing sites
7. Sexual or extremely violent content

Respond ONLY with a JSON object:
{
  "allowed": true/false,
  "reason": "Brief explanation if not allowed, or 'ok' if allowed",
  "severity": "low/medium/high" (only if not allowed)
}

Be reasonable - allow casual conversation, mild language, and gaming banter. Only flag truly problematic content.`
          },
          { role: "user", content: `Moderate this chat message: "${message}"` }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Allow message on AI failure to not block chat
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Moderation service unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let moderationResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        moderationResult = { allowed: true, reason: 'Could not parse response' };
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      moderationResult = { allowed: true, reason: 'Parse error' };
    }

    // If message is not allowed, log it
    if (!moderationResult.allowed && messageId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('automod_logs').insert({
        message_id: messageId,
        user_id: userId,
        original_content: message,
        flagged_reason: moderationResult.reason,
        action_taken: moderationResult.severity === 'high' ? 'blocked' : 'warned'
      });

      // For high severity, delete the message
      if (moderationResult.severity === 'high') {
        await supabase
          .from('global_messages')
          .update({ is_deleted: true })
          .eq('id', messageId);
      }
    }

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Automod error:", error);
    return new Response(
      JSON.stringify({ allowed: true, reason: 'Error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});