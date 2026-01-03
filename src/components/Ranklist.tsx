import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, User } from 'lucide-react';

interface RanklistUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  rank: string | null;
}

export const Ranklist = () => {
  const [users, setUsers] = useState<RanklistUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanklist = async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, username, avatar_url, xp, rank')
        .order('xp', { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchRanklist();
  }, []);

  const getPositionStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';
      case 1:
        return 'bg-slate-400/20 border-slate-400/50 text-slate-400';
      case 2:
        return 'bg-amber-700/20 border-amber-700/50 text-amber-700';
      default:
        return 'bg-muted/20 border-border';
    }
  };

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-neon-orange" />
            Ranklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading ranklist...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-neon-orange" />
          XP Ranklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {users.map((user, index) => (
              <div
                key={user.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getPositionStyle(index)}`}
              >
                <div className="flex items-center justify-center w-8">
                  {getPositionIcon(index)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.username || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.xp.toLocaleString()} XP
                  </div>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">
                  {user.rank || 'bronze'}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
