import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  friend_id: string;
  username: string | null;
  avatar_url: string | null;
  status: string;
  address_number: string | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester?: {
    username: string | null;
    avatar_url: string | null;
    address_number: string | null;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend profiles
      const friendIds = friendships?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || [];

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, address_number')
          .in('user_id', friendIds);

        const friendList: Friend[] = friendships?.map(f => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
          const profile = profiles?.find(p => p.user_id === friendId);
          return {
            id: f.id,
            friend_id: friendId,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            status: f.status,
            address_number: profile?.address_number || null,
          };
        }) || [];

        setFriends(friendList);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    try {
      // Incoming requests
      const { data: incoming, error: inError } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (inError) throw inError;

      // Get requester profiles
      const requesterIds = incoming?.map(r => r.requester_id) || [];
      if (requesterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, address_number')
          .in('user_id', requesterIds);

        const requests: FriendRequest[] = incoming?.map(r => ({
          ...r,
          requester: profiles?.find(p => p.user_id === r.requester_id),
        })) || [];

        setPendingRequests(requests);
      } else {
        setPendingRequests([]);
      }

      // Sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select('*')
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;
      setSentRequests(sent || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendFriendRequest = async (addressNumber: string) => {
    if (!user) return false;

    try {
      // Find user by address number
      const { data: targetUser, error: findError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('address_number', addressNumber.toUpperCase())
        .single();

      if (findError || !targetUser) {
        toast({ title: 'User not found', description: 'Invalid address number', variant: 'destructive' });
        return false;
      }

      if (targetUser.user_id === user.id) {
        toast({ title: 'Error', description: 'You cannot add yourself', variant: 'destructive' });
        return false;
      }

      // Check if already friends or request exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUser.user_id}),and(requester_id.eq.${targetUser.user_id},addressee_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        toast({ title: 'Request exists', description: 'A friend request already exists', variant: 'destructive' });
        return false;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: user.id, addressee_id: targetUser.user_id });

      if (error) throw error;

      toast({ title: 'Request sent', description: 'Friend request sent successfully' });
      fetchPendingRequests();
      return true;
    } catch (error) {
      console.error('Error sending request:', error);
      toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
      return false;
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast({ title: accept ? 'Friend added!' : 'Request declined' });
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({ title: 'Error', description: 'Failed to respond', variant: 'destructive' });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({ title: 'Friend removed' });
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({ title: 'Error', description: 'Failed to remove friend', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('friendships-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
          fetchFriends();
          fetchPendingRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchFriends, fetchPendingRequests]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    respondToRequest,
    removeFriend,
    refetch: () => { fetchFriends(); fetchPendingRequests(); },
  };
};
