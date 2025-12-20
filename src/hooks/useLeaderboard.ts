import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  created_at: string;
  username?: string;
}

export const useLeaderboard = (gameId?: string) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeaderboard = async () => {
    let query = supabase
      .from('leaderboards')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);
    
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    
    const { data } = await query;
    
    if (data) {
      // Fetch usernames for entries
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const usernameMap = new Map(
        profiles?.map(p => [p.user_id, p.username]) || []
      );
      
      setEntries(
        data.map(entry => ({
          ...entry,
          username: usernameMap.get(entry.user_id) || 'Anonymous'
        }))
      );
    }
    
    setLoading(false);
  };

  const submitScore = async (score: number, gameIdOverride?: string) => {
    if (!user) return false;
    
    const targetGameId = gameIdOverride || gameId;
    if (!targetGameId) return false;
    
    const { error } = await supabase
      .from('leaderboards')
      .insert({
        user_id: user.id,
        game_id: targetGameId,
        score
      });
    
    if (!error) {
      await fetchLeaderboard();
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [gameId]);

  return {
    entries,
    loading,
    submitScore,
    refreshLeaderboard: fetchLeaderboard
  };
};
