import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, MessageCircle, Users, UserPlus, Send, 
  Check, X, Copy, Mail, Bell 
} from 'lucide-react';
import { format } from 'date-fns';

const Messages = () => {
  const { user, profile } = useAuth();
  const { friends, pendingRequests, sendFriendRequest, respondToRequest, removeFriend } = useFriends();
  const { 
    conversations, messages, messageRequests, 
    activeConversation, setActiveConversation, 
    sendMessage, fetchMessages, respondToMessageRequest 
  } = useDirectMessages();

  const [newMessage, setNewMessage] = useState('');
  const [addFriendAddress, setAddFriendAddress] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;
    const success = await sendMessage(activeConversation, newMessage);
    if (success) setNewMessage('');
  };

  const handleAddFriend = async () => {
    if (!addFriendAddress.trim()) return;
    const success = await sendFriendRequest(addFriendAddress);
    if (success) setAddFriendAddress('');
  };

  const copyAddress = () => {
    if (profile?.address_number) {
      navigator.clipboard.writeText(profile.address_number);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const startConversation = (friendId: string) => {
    setActiveConversation(friendId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 border-border/50 p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access messages</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const activePartner = conversations.find(c => c.partner_id === activeConversation) ||
    friends.find(f => f.friend_id === activeConversation);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="font-display text-xl font-bold">Messages</h1>
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread} unread</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Your Address:</span>
              <code className="bg-muted/50 px-2 py-1 rounded font-mono">
                {profile?.address_number || 'Loading...'}
              </code>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                {copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Sidebar */}
          <Card className="bg-card/50 border-border/50 lg:col-span-1 flex flex-col">
            <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-3 m-2">
                <TabsTrigger value="conversations" className="relative">
                  <MessageCircle className="w-4 h-4" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {totalUnread}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="friends" className="relative">
                  <Users className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="requests" className="relative">
                  <Bell className="w-4 h-4" />
                  {(pendingRequests.length + messageRequests.length) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {pendingRequests.length + messageRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversations" className="flex-1 m-0 p-2">
                <ScrollArea className="h-full">
                  {conversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No conversations yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map(conv => (
                        <button
                          key={conv.partner_id}
                          onClick={() => setActiveConversation(conv.partner_id)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            activeConversation === conv.partner_id 
                              ? 'bg-primary/20 border border-primary/30' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={conv.partner_avatar || undefined} />
                              <AvatarFallback>{conv.partner_username?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {conv.partner_username || 'Unknown'}
                                </span>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.last_message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="friends" className="flex-1 m-0 p-2">
                <div className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter address (XXXX-XXXX)"
                      value={addFriendAddress}
                      onChange={(e) => setAddFriendAddress(e.target.value)}
                      className="font-mono"
                    />
                    <Button size="sm" onClick={handleAddFriend}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100%-60px)]">
                  {friends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No friends yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {friends.map(friend => (
                        <div
                          key={friend.id}
                          className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={friend.avatar_url || undefined} />
                              <AvatarFallback>{friend.username?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium">{friend.username || 'Unknown'}</span>
                              <p className="text-xs text-muted-foreground font-mono">
                                {friend.address_number}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => startConversation(friend.friend_id)}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="requests" className="flex-1 m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Friend Requests */}
                    {pendingRequests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Friend Requests
                        </h4>
                        <div className="space-y-2">
                          {pendingRequests.map(req => (
                            <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={req.requester?.avatar_url || undefined} />
                                  <AvatarFallback>{req.requester?.username?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <span className="font-medium text-sm">
                                    {req.requester?.username || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => respondToRequest(req.id, true)}>
                                    <Check className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => respondToRequest(req.id, false)}>
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Requests */}
                    {messageRequests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Message Requests
                        </h4>
                        <div className="space-y-2">
                          {messageRequests.map(req => (
                            <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3 mb-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={req.sender?.avatar_url || undefined} />
                                  <AvatarFallback>{req.sender?.username?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {req.sender?.username || 'Unknown'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {req.content}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => respondToMessageRequest(req.id, true)}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => respondToMessageRequest(req.id, false)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingRequests.length === 0 && messageRequests.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No pending requests
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className="bg-card/50 border-border/50 lg:col-span-2 flex flex-col">
            {activeConversation && activePartner ? (
              <>
                {/* Chat Header */}
                <CardHeader className="py-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={
                        'partner_avatar' in activePartner 
                          ? activePartner.partner_avatar || undefined 
                          : activePartner.avatar_url || undefined
                      } />
                      <AvatarFallback>
                        {'partner_username' in activePartner 
                          ? activePartner.partner_username?.[0] 
                          : activePartner.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {'partner_username' in activePartner 
                          ? activePartner.partner_username 
                          : activePartner.username || 'Unknown'}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender_id === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_id === user.id 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
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

                {/* Message Input */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Text only • AI moderated
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation or friend to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
