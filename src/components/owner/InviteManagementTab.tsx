import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Link2, 
  Search, 
  Users, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  UserPlus,
  Gift
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InviteLink {
  id: string;
  code: string;
  creator_id: string;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  creator_username?: string;
}

interface InviteRedemption {
  id: string;
  invite_link_id: string;
  invited_user_id: string;
  redeemed_at: string;
  invited_username?: string;
}

export const InviteManagementTab = () => {
  const { toast } = useToast();
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [redemptions, setRedemptions] = useState<InviteRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch all invite links
    const { data: linksData, error: linksError } = await supabase
      .from('invite_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (linksError) {
      console.error('Error fetching invite links:', linksError);
      toast({
        title: "Error",
        description: "Failed to load invite links",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Fetch all redemptions
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from('invite_redemptions')
      .select('*')
      .order('redeemed_at', { ascending: false });

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError);
    }

    // Get unique user IDs for username lookup
    const creatorIds = [...new Set(linksData?.map(l => l.creator_id) || [])];
    const invitedIds = [...new Set(redemptionsData?.map(r => r.invited_user_id) || [])];
    const allUserIds = [...new Set([...creatorIds, ...invitedIds])];

    // Fetch usernames
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', allUserIds);

    const usernameMap = new Map(
      profilesData?.map(p => [p.user_id, p.username || 'Unknown']) || []
    );

    // Enrich links with creator usernames
    const enrichedLinks = linksData?.map(link => ({
      ...link,
      creator_username: usernameMap.get(link.creator_id) || 'Unknown'
    })) || [];

    // Enrich redemptions with invited usernames
    const enrichedRedemptions = redemptionsData?.map(r => ({
      ...r,
      invited_username: usernameMap.get(r.invited_user_id) || 'Unknown'
    })) || [];

    setInviteLinks(enrichedLinks);
    setRedemptions(enrichedRedemptions);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    setUpdatingId(linkId);

    const { error } = await supabase
      .from('invite_links')
      .update({ is_active: !currentStatus })
      .eq('id', linkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update link status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Invite link ${!currentStatus ? 'activated' : 'deactivated'}`
      });
      await fetchData();
    }

    setUpdatingId(null);
  };

  const deleteLink = async (linkId: string) => {
    setUpdatingId(linkId);

    const { error } = await supabase
      .from('invite_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete link. Make sure no redemptions are linked to it.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Deleted",
        description: "Invite link has been removed"
      });
      await fetchData();
    }

    setUpdatingId(null);
  };

  const getRedemptionsForLink = (linkId: string) => {
    return redemptions.filter(r => r.invite_link_id === linkId);
  };

  const filteredLinks = inviteLinks.filter(link => 
    link.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.creator_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInvites = redemptions.length;
  const totalCreditsAwarded = totalInvites * 400; // 200 per person x 2
  const totalXpAwarded = totalInvites * 1000; // 500 per person x 2

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inviteLinks.length}</p>
                <p className="text-sm text-muted-foreground">Total Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInvites}</p>
                <p className="text-sm text-muted-foreground">Total Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCreditsAwarded.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Credits Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalXpAwarded.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">XP Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Links Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            All Invite Links
          </CardTitle>
          <CardDescription>
            View and manage all invite links in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No invite links found</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredLinks.map((link) => {
                const linkRedemptions = getRedemptionsForLink(link.id);
                return (
                  <AccordionItem key={link.id} value={link.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 w-full pr-4">
                        <div className="flex-1 flex items-center gap-3">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {link.code}
                          </code>
                          <Badge variant={link.is_active ? "default" : "secondary"}>
                            {link.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>by {link.creator_username}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {link.uses_count}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Created: {format(new Date(link.created_at), 'MMM d, yyyy HH:mm')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleLinkStatus(link.id, link.is_active)}
                              disabled={updatingId === link.id}
                            >
                              {updatingId === link.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : link.is_active ? (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={updatingId === link.id || link.uses_count > 0}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invite Link?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the invite link "{link.code}". 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteLink(link.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {linkRedemptions.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Invited User</TableHead>
                                  <TableHead>Joined</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {linkRedemptions.map((redemption) => (
                                  <TableRow key={redemption.id}>
                                    <TableCell className="font-medium">
                                      {redemption.invited_username}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {format(new Date(redemption.redeemed_at), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                            No users have used this invite link yet
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
