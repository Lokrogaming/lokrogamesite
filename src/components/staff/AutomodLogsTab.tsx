import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, AlertTriangle, Clock, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutomodLog {
  id: string;
  message_id: string | null;
  user_id: string;
  original_content: string;
  flagged_reason: string;
  action_taken: string;
  created_at: string;
  profile?: {
    username: string | null;
  };
}

export const AutomodLogsTab = () => {
  const [logs, setLogs] = useState<AutomodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, { username: string | null }>>({});

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('automod-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'automod_logs' },
        (payload) => {
          const newLog = payload.new as AutomodLog;
          setLogs(prev => [newLog, ...prev]);
          fetchProfile(newLog.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('automod_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setLogs(data);
      const userIds = [...new Set(data.map(l => l.user_id))];
      for (const id of userIds) {
        fetchProfile(id);
      }
    }
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    if (profiles[userId]) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfiles(prev => ({ ...prev, [userId]: data }));
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'warned':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warned</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Automod Logs
        </CardTitle>
        <CardDescription>
          Messages flagged by the AI moderation system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No flagged messages yet</p>
            <p className="text-sm">The AI automod is monitoring the global chat</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 border border-border rounded-lg bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {profiles[log.user_id]?.username || 'Unknown User'}
                      </span>
                      {getActionBadge(log.action_taken)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm break-words">{log.original_content}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Reason:</span>
                    <span>{log.flagged_reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};