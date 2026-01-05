import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Check if this is a /v1/users request
    if (pathParts.length >= 2 && pathParts[0] === 'v1' && pathParts[1] === 'users') {
      const uid = url.searchParams.get('uid')
      const username = url.searchParams.get('username')

      if (!uid && !username) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: uid or username' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Build query based on parameter
      let query = supabase
        .from('profiles')
        .select('*')
      
      if (uid) {
        query = query.eq('user_id', uid)
      } else if (username) {
        query = query.ilike('username', username)
      }

      const { data: profile, error: profileError } = await query.single()

      if (profileError || !profile) {
        console.log('Profile lookup error:', profileError)
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id)
        .single()

      // Get rank position based on rank_configs sort_order
      const { data: rankConfig } = await supabase
        .from('rank_configs')
        .select('sort_order')
        .eq('rank_key', profile.rank || 'bronze')
        .single()

      const rankPosition = rankConfig?.sort_order ?? 1

      // Construct response in the exact format requested
      const userResponse = {
        user: {
          uuid: profile.user_id,
          username: profile.username,
          creditValue: String(profile.credits),
          statusActive: !profile.is_banned,
          joinedAt: profile.created_at,
          _isBanned: profile.is_banned,
          _banReason: profile.ban_reason,
          tag: profile.tag,
          description: profile.description,
          xp: String(profile.xp),
          rank: rankPosition,
          role: roleData?.role || 'user',
          avatar: profile.avatar_url,
          lastCreditsRefill: profile.last_credit_refill
        }
      }

      return new Response(
        JSON.stringify(userResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default 404 for unhandled routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
