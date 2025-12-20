import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface MultiplayerSession {
  id: string;
  game_id: string;
  host_id: string;
  guest_id: string | null;
  status: string;
  game_state: Json | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useMultiplayer = (gameId: string) => {
  const [sessions, setSessions] = useState<MultiplayerSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MultiplayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('multiplayer_sessions')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });
    
    setSessions((data as MultiplayerSession[]) || []);
    setLoading(false);
  };

  const createSession = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create a multiplayer session",
        variant: "destructive"
      });
      return null;
    }

    const { data, error } = await supabase
      .from('multiplayer_sessions')
      .insert({
        game_id: gameId,
        host_id: user.id,
        status: 'waiting',
        game_state: {}
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive"
      });
      return null;
    }

    setCurrentSession(data as MultiplayerSession);
    return data as MultiplayerSession;
  };

  const joinSession = async (sessionId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join a session",
        variant: "destructive"
      });
      return false;
    }

    const { data, error } = await supabase
      .from('multiplayer_sessions')
      .update({
        guest_id: user.id,
        status: 'playing'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join session",
        variant: "destructive"
      });
      return false;
    }

    setCurrentSession(data as MultiplayerSession);
    return true;
  };

  const updateGameState = async (gameState: Json) => {
    if (!currentSession) return false;

    const { error } = await supabase
      .from('multiplayer_sessions')
      .update({ game_state: gameState })
      .eq('id', currentSession.id);

    return !error;
  };

  const endSession = async (winnerId?: string) => {
    if (!currentSession) return false;

    const { error } = await supabase
      .from('multiplayer_sessions')
      .update({
        status: 'finished',
        winner_id: winnerId || null
      })
      .eq('id', currentSession.id);

    if (!error) {
      setCurrentSession(null);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`multiplayer_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_sessions',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new as MultiplayerSession, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MultiplayerSession;
            if (currentSession?.id === updated.id) {
              setCurrentSession(updated);
            }
            setSessions(prev => 
              prev.map(s => s.id === updated.id ? updated : s)
                .filter(s => s.status === 'waiting')
            );
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return {
    sessions,
    currentSession,
    loading,
    createSession,
    joinSession,
    updateGameState,
    endSession,
    refreshSessions: fetchSessions
  };
};
