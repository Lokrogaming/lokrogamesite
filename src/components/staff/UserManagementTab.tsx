import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Ban, Clock, AlertTriangle, History, ShieldOff, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Database } from '@/integrations/supabase/types';

type ModerationAction = Database['public']['Enums']['moderation_action'];

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
  is_banned: boolean;
  ban_expires_at: string | null;
  ban_reason: string | null;
  created_at: string;
}

interface ModerationLog {
  id: string;
  target_user_id: string;
  moderator_id: string;
  action: ModerationAction;
  reason: string;
  duration_minutes: number | null;
  expires_at: string | null;
  created_at: string;
  moderator_username?: string;
}

const UserManagementTab = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [moderationAction, setModerationAction] = useState<ModerationAction>('warn');
  const [moderationReason, setModerationReason] = useState('');
  const [timeoutDuration, setTimeoutDuration] = useState('60');
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchModerationHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_moderation_logs')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch moderator usernames
      const modIds = [...new Set(data?.map(l => l.moderator_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', modIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]));

      const logsWithUsernames = data?.map(l => ({
        ...l,
        moderator_username: profileMap.get(l.moderator_id) || 'Unknown'
      })) || [];

      setModerationLogs(logsWithUsernames);
    } catch (error) {
      console.error('Error fetching moderation history:', error);
      toast.error('Failed to load moderation history');
    }
  };

  const handleModeration = async () => {
    if (!user || !selectedUser || !moderationReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const expiresAt = moderationAction === 'timeout' 
        ? new Date(Date.now() + parseInt(timeoutDuration) * 60 * 1000).toISOString()
        : moderationAction === 'ban' ? null : null;

      // Create moderation log
      const { error: logError } = await supabase
        .from('user_moderation_logs')
        .insert({
          target_user_id: selectedUser.user_id,
          moderator_id: user.id,
          action: moderationAction,
          reason: moderationReason,
          duration_minutes: moderationAction === 'timeout' ? parseInt(timeoutDuration) : null,
          expires_at: expiresAt
        });

      if (logError) throw logError;

      // Update profile ban status
      if (moderationAction === 'ban' || moderationAction === 'timeout') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_banned: true,
            ban_expires_at: expiresAt,
            ban_reason: moderationReason
          })
          .eq('user_id', selectedUser.user_id);

        if (profileError) throw profileError;
      } else if (moderationAction === 'unban') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_banned: false,
            ban_expires_at: null,
            ban_reason: null
          })
          .eq('user_id', selectedUser.user_id);

        if (profileError) throw profileError;
      }

      toast.success(`User ${moderationAction === 'unban' ? 'unbanned' : moderationAction + 'ed'} successfully`);
      setShowModerationDialog(false);
      setModerationReason('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error applying moderation:', error);
      toast.error('Failed to apply moderation action');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionIcon = (action: ModerationAction) => {
    switch (action) {
      case 'ban': return <Ban className="w-4 h-4 text-destructive" />;
      case 'timeout': return <Clock className="w-4 h-4 text-neon-orange" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-neon-orange" />;
      case 'unban': return <ShieldOff className="w-4 h-4 text-accent" />;
      case 'kick': return <User className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or ID..."
          className="pl-10 bg-input border-border"
        />
      </div>

      {/* Users Table */}
      <Card className="card-gradient border-border">
        <CardHeader>
          <CardTitle className="font-display">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>User</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userProfile) => (
                <TableRow key={userProfile.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userProfile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {userProfile.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{userProfile.username || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{userProfile.user_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{userProfile.credits}</TableCell>
                  <TableCell>
                    {userProfile.is_banned ? (
                      <Badge variant="destructive">
                        {userProfile.ban_expires_at ? 'Timeout' : 'Banned'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-accent text-accent">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(userProfile);
                          fetchModerationHistory(userProfile.user_id);
                          setShowHistoryDialog(true);
                        }}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(userProfile);
                          setModerationAction(userProfile.is_banned ? 'unban' : 'warn');
                          setShowModerationDialog(true);
                        }}
                      >
                        Moderate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Moderate User</DialogTitle>
            <DialogDescription>
              {selectedUser?.username || 'User'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={moderationAction} onValueChange={(v) => setModerationAction(v as ModerationAction)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                  {selectedUser?.is_banned && <SelectItem value="unban">Unban</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {moderationAction === 'timeout' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                <Select value={timeoutDuration} onValueChange={setTimeoutDuration}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                    <SelectItem value="10080">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModerationDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleModeration}
              variant={moderationAction === 'ban' ? 'destructive' : 'default'}
            >
              Apply {moderationAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Moderation History</DialogTitle>
            <DialogDescription>
              {selectedUser?.username || 'User'}'s moderation history
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {moderationLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No moderation history</p>
            ) : (
              <div className="space-y-3">
                {moderationLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getActionIcon(log.action)}
                      <span className="font-medium capitalize">{log.action}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {log.moderator_username}
                      {log.duration_minutes && ` • Duration: ${log.duration_minutes} min`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTab;
