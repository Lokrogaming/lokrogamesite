import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, Eye, Clock, FileCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameSubmission {
  id: string;
  user_id: string;
  game_name: string;
  description: string | null;
  category: string;
  game_code: string;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  submitter_username?: string;
}

const GameSubmissionsTab = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<GameSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('game_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames for submitters
      const userIds = [...new Set(data?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]));

      const submissionsWithUsernames = data?.map(s => ({
        ...s,
        submitter_username: profileMap.get(s.user_id) || 'Unknown'
      })) || [];

      setSubmissions(submissionsWithUsernames);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_submissions')
        .update({
          status,
          reviewer_notes: reviewNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Submission ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setSelectedSubmission(null);
      setReviewNotes('');
      fetchSubmissions();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    statusFilter === 'all' || s.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-neon-orange text-neon-orange"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-accent text-accent-foreground"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="card-gradient border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No submissions found
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="card-gradient border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-lg text-foreground">{submission.game_name}</CardTitle>
                    <CardDescription>
                      By {submission.submitter_username} • {new Date(submission.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{submission.description || 'No description'}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{submission.category}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowCodeDialog(true);
                    }}
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    View Code
                  </Button>
                  {submission.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  )}
                </div>
                {submission.reviewer_notes && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Reviewer Notes:</p>
                    <p className="text-sm">{submission.reviewer_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={selectedSubmission !== null && !showCodeDialog} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Review: {selectedSubmission?.game_name}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedSubmission?.submitter_username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Description</p>
              <p className="text-muted-foreground">{selectedSubmission?.description || 'No description'}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Review Notes</p>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedSubmission && handleReview(selectedSubmission.id, 'rejected')}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => selectedSubmission && handleReview(selectedSubmission.id, 'approved')}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Preview Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Code: {selectedSubmission?.game_name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto">
              <code>{selectedSubmission?.game_code}</code>
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameSubmissionsTab;
