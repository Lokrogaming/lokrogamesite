import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';

interface Challenge {
  id: string;
  title: string;
  description: string;
  game_id: string | null;
  target_score: number | null;
  reward_credits: number;
  challenge_date: string;
  completed?: boolean;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { earnCredits } = useCredits();

  const fetchChallenges = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challengeData } = await supabase
      .from('daily_challenges')
      .select('*')
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
        challengeData.map(c => ({
          ...c,
          completed: completedIds.has(c.id)
        }))
      );
    } else {
      setChallenges(challengeData || []);
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
      await earnCredits(challenge.reward_credits, `Completed: ${challenge.title}`);
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
    refreshChallenges: fetchChallenges
  };
};
