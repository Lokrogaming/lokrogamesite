import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MessageCircle,
  Send,
  Reply,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Ban,
  Clock,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  is_deleted: boolean;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  reply_to?: {
    id: string;
    content: string;
    is_deleted: boolean;
    user_id?: string;
    profile?: {
      username: string | null;
    };
  };
}

interface ModerationAction {
  type: 'warn' | 'timeout' | 'kick' | 'ban';
  userId: string;
  username: string;
}

const GlobalChat = () => {
  const { user, profile, isStaff } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; avatar_url: string | null }>>({});
  
  // Moderation dialog state
  const [moderationAction, setModerationAction] = useState<ModerationAction | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationDuration, setModerationDuration] = useState('60');
  const [moderating, setModerating] = useState(false);

  // Fetch profiles for user IDs
  const fetchProfiles = async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds)].filter(id => !profiles[id]);
    if (uniqueIds.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', uniqueIds);

    if (data) {
      const newProfiles: Record<string, { username: string | null; avatar_url: string | null }> = {};
      data.forEach(p => {
        newProfiles[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
      });
      setProfiles(prev => ({ ...prev, ...newProfiles }));
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('global_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      // Fetch reply messages
      const replyIds = data.filter(m => m.reply_to_id).map(m => m.reply_to_id);
      let replyMessages: any[] = [];
      
      if (replyIds.length > 0) {
        const { data: replies } = await supabase
          .from('global_messages')
          .select('id, content, is_deleted, user_id')
          .in('id', replyIds);
        replyMessages = replies || [];
      }

      // Get all user IDs
      const userIds = [...data.map(m => m.user_id), ...replyMessages.map(r => r.user_id)];
      await fetchProfiles(userIds);

      // Map messages with replies
      const messagesWithReplies = data.map(msg => {
        const reply = replyMessages.find(r => r.id === msg.reply_to_id);
        return {
          ...msg,
          reply_to: reply ? {
            id: reply.id,
            content: reply.content,
            is_deleted: reply.is_deleted,
            user_id: reply.user_id
          } : undefined
        };
      });

      setMessages(messagesWithReplies);
      setLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_messages'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            await fetchProfiles([newMsg.user_id]);
            
            // Fetch reply if exists
            let replyData = undefined;
            if (newMsg.reply_to_id) {
              const { data } = await supabase
                .from('global_messages')
                .select('id, content, is_deleted, user_id')
                .eq('id', newMsg.reply_to_id)
                .single();
              if (data) {
                await fetchProfiles([data.user_id]);
                replyData = data;
              }
            }
            
            setMessages(prev => [...prev, { ...newMsg, reply_to: replyData }]);
            
            setTimeout(() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);

    const { error } = await supabase
      .from('global_messages')
      .insert({
        user_id: user.id,
        content: newMessage.trim(),
        reply_to_id: replyTo?.id || null
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
      setReplyTo(null);
    }

    setSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('global_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Message deleted',
        description: 'The message has been removed'
      });
    }
  };

  const handleModerationSubmit = async () => {
    if (!moderationAction || !moderationReason.trim()) return;

    setModerating(true);

    try {
      const durationMinutes = moderationAction.type === 'timeout' ? parseInt(moderationDuration) : null;
      const expiresAt = durationMinutes 
        ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        : moderationAction.type === 'ban' ? null : undefined;

      // Log moderation action
      await supabase.from('user_moderation_logs').insert({
        moderator_id: user!.id,
        target_user_id: moderationAction.userId,
        action: moderationAction.type,
        reason: moderationReason.trim(),
        duration_minutes: durationMinutes,
        expires_at: expiresAt
      });

      // Apply ban/timeout to profile if needed
      if (moderationAction.type === 'ban' || moderationAction.type === 'timeout') {
        await supabase
          .from('profiles')
          .update({
            is_banned: true,
            ban_reason: moderationReason.trim(),
            ban_expires_at: expiresAt
          })
          .eq('user_id', moderationAction.userId);
      }

      toast({
        title: 'Action Applied',
        description: `User has been ${moderationAction.type === 'warn' ? 'warned' : moderationAction.type === 'timeout' ? 'timed out' : moderationAction.type === 'kick' ? 'kicked' : 'banned'}`
      });

      setModerationAction(null);
      setModerationReason('');
      setModerationDuration('60');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply moderation action',
        variant: 'destructive'
      });
    } finally {
      setModerating(false);
    }
  };

  const getProfile = (userId: string) => profiles[userId] || { username: null, avatar_url: null };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
        <p>Please log in to view the global chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-lg bg-card/50">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Global Chat</h3>
        <span className="text-xs text-muted-foreground ml-auto">{messages.filter(m => !m.is_deleted).length} messages</span>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const msgProfile = getProfile(msg.user_id);
              const replyProfile = msg.reply_to ? getProfile(msg.reply_to.user_id || '') : null;
              const isOwn = msg.user_id === user.id;
              const canModerate = isStaff && !isOwn;

              if (msg.is_deleted) {
                return (
                  <div key={msg.id} className="flex items-center gap-2 text-muted-foreground italic text-sm">
                    <Trash2 className="h-3 w-3" />
                    <span>Message deleted</span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="group flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msgProfile.avatar_url || ''} />
                    <AvatarFallback className="bg-muted text-xs">
                      {msgProfile.username?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {msgProfile.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Reply reference */}
                    {msg.reply_to && (
                      <div className="flex items-center gap-1 mt-1 mb-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 max-w-[80%]">
                        <Reply className="h-3 w-3 shrink-0" />
                        <span className="font-medium">{replyProfile?.username || 'Anonymous'}:</span>
                        <span className="truncate">
                          {msg.reply_to.is_deleted ? 'Message deleted' : msg.reply_to.content}
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-foreground break-words">{msg.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setReplyTo(msg);
                        inputRef.current?.focus();
                      }}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>

                    {(isOwn || isStaff) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isOwn && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          
                          {canModerate && (
                            <>
                              {isOwn && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setModerationAction({
                                  type: 'warn',
                                  userId: msg.user_id,
                                  username: msgProfile.username || 'User'
                                })}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                                Warn User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setModerationAction({
                                  type: 'timeout',
                                  userId: msg.user_id,
                                  username: msgProfile.username || 'User'
                                })}
                              >
                                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                Timeout User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setModerationAction({
                                  type: 'kick',
                                  userId: msg.user_id,
                                  username: msgProfile.username || 'User'
                                })}
                              >
                                <User className="h-4 w-4 mr-2 text-red-400" />
                                Kick User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setModerationAction({
                                  type: 'ban',
                                  userId: msg.user_id,
                                  username: msgProfile.username || 'User'
                                })}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-t border-border">
          <Reply className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-medium">{getProfile(replyTo.user_id).username || 'Anonymous'}</span>
          </span>
          <span className="text-sm text-muted-foreground truncate flex-1">: {replyTo.content}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background/50"
            maxLength={500}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* Moderation Dialog */}
      <Dialog open={!!moderationAction} onOpenChange={() => setModerationAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {moderationAction?.type === 'warn' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {moderationAction?.type === 'timeout' && <Clock className="h-5 w-5 text-orange-500" />}
              {moderationAction?.type === 'kick' && <User className="h-5 w-5 text-red-400" />}
              {moderationAction?.type === 'ban' && <Ban className="h-5 w-5 text-destructive" />}
              {moderationAction?.type === 'warn' && 'Warn User'}
              {moderationAction?.type === 'timeout' && 'Timeout User'}
              {moderationAction?.type === 'kick' && 'Kick User'}
              {moderationAction?.type === 'ban' && 'Ban User'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Taking action against <span className="font-medium text-foreground">{moderationAction?.username}</span>
            </p>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Enter the reason for this action..."
                rows={3}
              />
            </div>

            {moderationAction?.type === 'timeout' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={moderationDuration}
                  onChange={(e) => setModerationDuration(e.target.value)}
                  min="1"
                  max="10080"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleModerationSubmit}
              disabled={!moderationReason.trim() || moderating}
              variant={moderationAction?.type === 'ban' ? 'destructive' : 'default'}
            >
              {moderating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalChat;