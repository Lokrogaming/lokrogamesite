import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  game_id: string | null;
  target_score: number | null;
  reward_credits: number;
  reward_item_id: string | null;
  reward_item_quantity: number | null;
  reward_item_name?: string;
  challenge_date: string;
  completed?: boolean;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { earnCredits } = useCredits();
  const { toast } = useToast();

  const fetchChallenges = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challengeData } = await supabase
      .from('daily_challenges')
      .select(`
        *,
        item_type:item_types(name)
      `)
      .eq('challenge_date', today);
    
    if (challengeData && user) {
      const { data: userChallenges } = await supabase
        .from('user_challenges')
        .select('challenge_id, completed')
        .eq('user_id', user.id);
      
      const completedIds = new Set(
        userChallenges?.filter(uc => uc.completed).map(uc => uc.challenge_id) || []
      );
      
      setChallenges(
        challengeData.map((c: any) => ({
          ...c,
          reward_item_name: c.item_type?.name,
          completed: completedIds.has(c.id)
        }))
      );
    } else {
      setChallenges((challengeData || []).map((c: any) => ({
        ...c,
        reward_item_name: c.item_type?.name
      })));
    }
    
    setLoading(false);
  };

  const completeChallenge = async (challengeId: string) => {
    if (!user) return false;
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.completed) return false;
    
    const { error } = await supabase
      .from('user_challenges')
      .upsert({
        user_id: user.id,
        challenge_id: challengeId,
        completed: true,
        completed_at: new Date().toISOString()
      });
    
    if (!error) {
      // Award credits
      await earnCredits(challenge.reward_credits, `Completed: ${challenge.title}`);
      
      // Award item if exists
      if (challenge.reward_item_id) {
        await supabase.rpc('award_item', {
          _user_id: user.id,
          _item_type_id: challenge.reward_item_id,
          _quantity: challenge.reward_item_quantity || 1
        });
        
        toast({
          title: "Item Received!",
          description: `You received ${challenge.reward_item_quantity || 1}x ${challenge.reward_item_name || 'item'}!`
        });
      }
      
      await fetchChallenges();
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  return {
    challenges,
    loading,
    completeChallenge,
    completedCount: challenges.filter(c => c.completed).length,
    maxChallenges: challenges.length,
    refreshChallenges: fetchChallenges
  };
};
