import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
}

interface MessageRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: string;
  created_at: string;
  sender?: {
    username: string | null;
    avatar_url: string | null;
    address_number: string | null;
  };
}

interface Conversation {
  partner_id: string;
  partner_username: string | null;
  partner_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useDirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Get all messages
      const { data: allMessages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, DirectMessage[]>();
      allMessages?.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(msg);
      });

      // Get partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', partnerIds);

        const convos: Conversation[] = partnerIds.map(partnerId => {
          const msgs = conversationMap.get(partnerId)!;
          const profile = profiles?.find(p => p.user_id === partnerId);
          const unreadCount = msgs.filter(m => m.receiver_id === user.id && !m.is_read).length;
          
          return {
            partner_id: partnerId,
            partner_username: profile?.username || null,
            partner_avatar: profile?.avatar_url || null,
            last_message: msgs[0].content,
            last_message_time: msgs[0].created_at,
            unread_count: unreadCount,
          };
        });

        setConversations(convos.sort((a, b) => 
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        ));
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, fetchConversations]);

  const fetchMessageRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get sender profiles
      const senderIds = data?.map(r => r.sender_id) || [];
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, address_number')
          .in('user_id', senderIds);

        const requests: MessageRequest[] = data?.map(r => ({
          ...r,
          sender: profiles?.find(p => p.user_id === r.sender_id),
        })) || [];

        setMessageRequests(requests);
      } else {
        setMessageRequests([]);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  }, [user]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return false;

    try {
      // Run automod check via edge function
      const { data: automodResult, error: automodError } = await supabase.functions.invoke('automod', {
        body: { content, userId: user.id, type: 'dm' }
      });

      if (automodError) {
        console.error('Automod error:', automodError);
      }

      if (automodResult?.blocked) {
        toast({ 
          title: 'Message blocked', 
          description: automodResult.reason || 'Your message was flagged by automod', 
          variant: 'destructive' 
        });
        return false;
      }

      const finalContent = automodResult?.filteredContent || content;

      // Check if friends or message access
      const { data: areFriends } = await supabase.rpc('are_friends', { 
        _user1: user.id, 
        _user2: receiverId 
      });

      if (!areFriends) {
        // Check message request status
        const { data: hasAccess } = await supabase.rpc('has_message_access', { 
          _sender: user.id, 
          _receiver: receiverId 
        });

        if (!hasAccess) {
          // Send message request instead
          const { error: reqError } = await supabase
            .from('message_requests')
            .upsert({ 
              sender_id: user.id, 
              receiver_id: receiverId, 
              content: finalContent,
              status: 'pending'
            });

          if (reqError) throw reqError;
          
          toast({ title: 'Message request sent', description: 'Waiting for user to accept' });
          return true;
        }
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: user.id, receiver_id: receiverId, content: finalContent });

      if (error) throw error;

      if (activeConversation === receiverId) {
        fetchMessages(receiverId);
      }
      fetchConversations();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
      return false;
    }
  };

  const respondToMessageRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast({ title: accept ? 'Request accepted' : 'Request declined' });
      fetchMessageRequests();
    } catch (error) {
      console.error('Error responding to message request:', error);
      toast({ title: 'Error', description: 'Failed to respond', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchMessageRequests();

      // Subscribe to realtime messages
      const channel = supabase
        .channel('dm-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
          const newMsg = payload.new as DirectMessage;
          if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
            fetchConversations();
            if (activeConversation && (newMsg.sender_id === activeConversation || newMsg.receiver_id === activeConversation)) {
              fetchMessages(activeConversation);
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, () => {
          fetchMessageRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeConversation, fetchConversations, fetchMessages, fetchMessageRequests]);

  return {
    conversations,
    messages,
    messageRequests,
    loading,
    activeConversation,
    setActiveConversation,
    sendMessage,
    fetchMessages,
    respondToMessageRequest,
    refetch: () => { fetchConversations(); fetchMessageRequests(); },
  };
};
