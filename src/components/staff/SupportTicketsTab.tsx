import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Send, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TicketWithUser {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  username?: string;
  avatar_url?: string;
}

const statusColors = {
  open: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-500 border-green-500/30',
  closed: 'bg-muted text-muted-foreground border-muted'
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle
};

export const SupportTicketsTab = () => {
  const { user } = useAuth();
  const { tickets, activeTicket, setActiveTicket, messages, sendMessage, updateTicketStatus } = useSupportTickets();
  const [ticketsWithUsers, setTicketsWithUsers] = useState<TicketWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user info for tickets
  useEffect(() => {
    const fetchUserInfo = async () => {
      const userIds = [...new Set(tickets.map(t => t.user_id))];
      if (userIds.length === 0) {
        setTicketsWithUsers([]);
        return;
      }

      const { data } = await supabase
        .from('public_profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const userMap = new Map(data?.map(u => [u.user_id, u]) || []);
      
      setTicketsWithUsers(tickets.map(t => ({
        ...t,
        username: userMap.get(t.user_id)?.username || undefined,
        avatar_url: userMap.get(t.user_id)?.avatar_url || undefined
      })));
    };

    fetchUserInfo();
  }, [tickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!activeTicket || !newMessage.trim()) return;
    const success = await sendMessage(activeTicket.id, newMessage, true);
    if (success) setNewMessage('');
  };

  const filteredTickets = ticketsWithUsers.filter(t => 
    filter === 'all' || t.status === filter
  );

  const openCount = ticketsWithUsers.filter(t => t.status === 'open').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
      {/* Tickets List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Tickets
              {openCount > 0 && (
                <Badge variant="destructive">{openCount}</Badge>
              )}
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-400px)]">
            {filteredTickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No tickets found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTickets.map(ticket => {
                  const StatusIcon = statusIcons[ticket.status];
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        activeTicket?.id === ticket.id
                          ? 'bg-primary/20 border border-primary/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={ticket.avatar_url || undefined} />
                          <AvatarFallback>
                            {ticket.username?.[0] || <User className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {ticket.username || 'Unknown'}
                            </span>
                            <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground truncate mt-1">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(ticket.updated_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="bg-card/50 border-border/50 lg:col-span-2 flex flex-col">
        {activeTicket ? (
          <>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{activeTicket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(activeTicket.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Select 
                  value={activeTicket.status} 
                  onValueChange={(value) => updateTicketStatus(activeTicket.id, value as any)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_staff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.is_staff
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.is_staff && (
                          <p className="text-xs opacity-70 mb-1">Staff Response</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.is_staff ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your response..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a ticket to view conversation</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
