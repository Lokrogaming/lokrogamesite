import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Search, User, Trash2, Eye, Ban, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
  xp: number;
  rank: string | null;
  is_banned: boolean;
  created_at: string;
}

interface UserRole {
  role: string;
}

export const AccountManagementTab = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, avatar_url, credits, xp, rank, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    setUserRoles(data?.map((r: UserRole) => r.role) || []);
  };

  const handleViewDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    await fetchUserRoles(user.user_id);
    setDetailsOpen(true);
  };

  const handleDeleteAccount = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to delete "${user.username || 'Unknown'}"'s account? This action cannot be undone.`)) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.user_id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Account deleted successfully' });
      fetchUsers();
      setDetailsOpen(false);
    }
  };

  const handleToggleBan = async (user: UserProfile) => {
    const newBanStatus = !user.is_banned;
    const action = newBanStatus ? 'ban' : 'unban';

    if (!confirm(`Are you sure you want to ${action} "${user.username || 'Unknown'}"?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: newBanStatus,
        ban_reason: newBanStatus ? 'Banned by owner' : null,
        ban_expires_at: null
      })
      .eq('user_id', user.user_id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User ${action}ned successfully` });
      fetchUsers();
      if (selectedUser?.user_id === user.user_id) {
        setSelectedUser({ ...user, is_banned: newBanStatus });
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-muted-foreground">Loading users...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Management
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {user.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.credits.toLocaleString()}</TableCell>
                  <TableCell>{user.xp.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.rank || 'bronze'}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleBan(user)}>
                        {user.is_banned ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ban className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(user)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedUser.username || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedUser.user_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Credits:</span>
                  <p className="font-medium">{selectedUser.credits.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">XP:</span>
                  <p className="font-medium">{selectedUser.xp.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rank:</span>
                  <p className="font-medium capitalize">{selectedUser.rank || 'bronze'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedUser.is_banned ? 'Banned' : 'Active'}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Roles:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userRoles.length > 0 ? (
                    userRoles.map((role) => (
                      <Badge key={role} variant="outline" className="capitalize">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No roles</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Joined:</span>
                <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant={selectedUser.is_banned ? 'default' : 'destructive'}
                  className="flex-1"
                  onClick={() => handleToggleBan(selectedUser)}
                >
                  {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAccount(selectedUser)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
