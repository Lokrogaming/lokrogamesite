import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [unreadSystem, setUnreadSystem] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;

    // Fetch unread direct messages
    const { count: dmCount } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .eq('is_deleted', false);

    // Fetch unread system messages
    const { count: sysCount } = await supabase
      .from('system_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadDMs(dmCount || 0);
    setUnreadSystem(sysCount || 0);
  }, [user]);

  useEffect(() => {
    fetchUnreadCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new direct messages
    const dmChannel = supabase
      .channel('unread-dms')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          setUnreadDMs(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to new system messages
    const sysChannel = supabase
      .channel('unread-system')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_messages',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          setUnreadSystem(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(sysChannel);
    };
  }, [user]);

  const totalUnread = unreadDMs + unreadSystem;

  return {
    unreadDMs,
    unreadSystem,
    totalUnread,
    refetch: fetchUnreadCounts
  };
};
