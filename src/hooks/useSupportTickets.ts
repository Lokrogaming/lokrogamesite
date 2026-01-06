import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  // Joined fields for staff view
  username?: string;
  avatar_url?: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_staff: boolean;
  content: string;
  created_at: string;
}

export const useSupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setTickets(data as SupportTicket[]);
    }
    setLoading(false);
  }, [user]);

  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data as SupportMessage[]);
    }
  }, []);

  const createTicket = async (subject: string, initialMessage: string) => {
    if (!user) return null;

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({ user_id: user.id, subject })
      .select()
      .single();

    if (ticketError || !ticket) {
      toast.error('Failed to create ticket');
      return null;
    }

    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        is_staff: false,
        content: initialMessage
      });

    if (msgError) {
      toast.error('Failed to send initial message');
    }

    await fetchTickets();
    toast.success('Support ticket created');
    return ticket as SupportTicket;
  };

  const sendMessage = async (ticketId: string, content: string, isStaff: boolean = false) => {
    if (!user || !content.trim()) return false;

    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        is_staff: isStaff,
        content: content.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      return false;
    }

    // Update ticket timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return true;
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to update status');
      return false;
    }

    await fetchTickets();
    toast.success(`Ticket marked as ${status}`);
    return true;
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (activeTicket) {
      fetchTicketMessages(activeTicket.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket-${activeTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${activeTicket.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as SupportMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTicket, fetchTicketMessages]);

  return {
    tickets,
    activeTicket,
    setActiveTicket,
    messages,
    loading,
    createTicket,
    sendMessage,
    updateTicketStatus,
    fetchTickets
  };
};
