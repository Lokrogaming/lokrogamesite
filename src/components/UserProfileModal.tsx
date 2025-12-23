import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, Gamepad2, Link, Calendar } from 'lucide-react';

interface UserProfile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  description: string | null;
  tag: string | null;
  favorite_game: string | null;
  social_link: string | null;
  created_at: string;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({ userId, open, onOpenChange }: UserProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && open) {
      fetchProfile();
    }
  }, [userId, open]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, description, tag, favorite_game, social_link, created_at')
      .eq('user_id', userId)
      .maybeSingle();
    
    setProfile(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
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
                <h3 className="text-xl font-semibold">{profile.username || 'Anonymous'}</h3>
                {profile.tag && (
                  <Badge variant="secondary" className="mt-1">
                    {profile.tag}
                  </Badge>
                )}
              </div>
            </div>

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
