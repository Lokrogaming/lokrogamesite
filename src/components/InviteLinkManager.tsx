import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInviteLinks } from '@/hooks/useInviteLinks';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Users, Link2, Gift, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const InviteLinkManager = () => {
  const { inviteLinks, isLoading, createInviteLink, getInviteUrl } = useInviteLinks();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLink = async () => {
    setIsCreating(true);
    await createInviteLink();
    setIsCreating(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(getInviteUrl(code));
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard"
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Invite Friends</CardTitle>
          </div>
          <Button onClick={handleCreateLink} disabled={isCreating} size="sm">
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Link
          </Button>
        </div>
        <CardDescription>
          Share your invite links and earn 200 Credits + 500 XP for each friend who joins!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inviteLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invite links yet</p>
            <p className="text-sm">Create one to start inviting friends!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inviteLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Input
                      value={getInviteUrl(link.code)}
                      readOnly
                      className="font-mono text-sm bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(link.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {link.uses_count} uses
                    </span>
                    <span>
                      Created {format(new Date(link.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
