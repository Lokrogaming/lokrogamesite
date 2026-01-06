import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { User, Gamepad2, Link, Calendar, Shield, Zap, Share2, Check } from 'lucide-react';
import { RankBadge } from './RankBadge';
import { toast } from 'sonner';
type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'queen' | 'king' | 'legend';

const rankThresholds: { rank: UserRank; minXp: number }[] = [
  { rank: 'bronze', minXp: 0 },
  { rank: 'silver', minXp: 500 },
  { rank: 'gold', minXp: 2000 },
  { rank: 'platinum', minXp: 5000 },
  { rank: 'diamond', minXp: 10000 },
  { rank: 'master', minXp: 25000 },
  { rank: 'queen', minXp: 50000 },
  { rank: 'king', minXp: 75000 },
  { rank: 'legend', minXp: 100000 },
];

interface UserProfile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  description: string | null;
  tag: string | null;
  favorite_game: string | null;
  social_link: string | null;
  created_at: string;
  rank: UserRank | null;
  xp: number;
  isStaff?: boolean;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({ userId, open, onOpenChange }: UserProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyProfileLink = async () => {
    if (!userId) return;
    const profileUrl = `${window.location.origin}/profiles/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (userId && open) {
      fetchProfile();
    }
  }, [userId, open]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    // Fetch profile data from public_profiles view (safe fields only)
    const { data: profileData } = await supabase
      .from('public_profiles')
      .select('user_id, username, avatar_url, description, tag, favorite_game, social_link, created_at, rank, xp')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Check if user is staff
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['staff', 'admin', 'moderator'])
      .maybeSingle();
    
    if (profileData) {
      setProfile({ ...profileData, isStaff: !!roleData });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getXpProgress = (xp: number, rank: UserRank | null) => {
    const currentRankIndex = rankThresholds.findIndex(r => r.rank === rank);
    const nextRank = rankThresholds[currentRankIndex + 1];
    const currentRankThreshold = rankThresholds[currentRankIndex];
    
    if (!nextRank) return { progress: 100, currentXp: xp, nextXp: xp, nextRankName: 'Max' };
    
    const xpInCurrentRank = xp - currentRankThreshold.minXp;
    const xpNeededForNextRank = nextRank.minXp - currentRankThreshold.minXp;
    const progress = Math.min((xpInCurrentRank / xpNeededForNextRank) * 100, 100);
    
    return { 
      progress, 
      currentXp: xp, 
      nextXp: nextRank.minXp, 
      nextRankName: nextRank.rank.charAt(0).toUpperCase() + nextRank.rank.slice(1) 
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>User Profile</DialogTitle>
          {profile && (
            <Button variant="outline" size="sm" onClick={copyProfileLink} className="h-8">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          )}
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.username?.[0]?.toUpperCase() || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{profile.username || 'Anonymous'}</h3>
                  {profile.isStaff && (
                    <Shield className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile.rank && (
                    <RankBadge rank={profile.rank} size="sm" />
                  )}
                  {profile.isStaff && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Shield className="h-3 w-3 mr-1" />
                      Staff
                    </Badge>
                  )}
                  {profile.tag && (
                    <Badge variant="secondary">
                      {profile.tag}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* XP Progress */}
            {profile.rank && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{profile.xp.toLocaleString()} XP</span>
                  </div>
                  <span className="text-muted-foreground">
                    Next: {getXpProgress(profile.xp, profile.rank).nextRankName}
                  </span>
                </div>
                <Progress 
                  value={getXpProgress(profile.xp, profile.rank).progress} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{profile.xp.toLocaleString()}</span>
                  <span>{getXpProgress(profile.xp, profile.rank).nextXp.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Description */}
            {profile.description && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2">
              {profile.favorite_game && (
                <div className="flex items-center gap-2 text-sm">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Favorite Game:</span>
                  <span>{profile.favorite_game}</span>
                </div>
              )}
              
              {profile.social_link && (
                <div className="flex items-center gap-2 text-sm">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Link:</span>
                  <a 
                    href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    {profile.social_link}
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span>{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profile not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
