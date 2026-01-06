import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemMessage {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useSystemMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('system_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data as SystemMessage[]);
      setUnreadCount(data.filter(m => !m.is_read).length);
    }
    setLoading(false);
  }, [user]);

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('system_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('system_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new system messages
    const channel = supabase
      .channel('system-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setMessages(prev => [payload.new as SystemMessage, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    messages,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchMessages
  };
};
