import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RankBadge } from '@/components/RankBadge';
import { User, Calendar, Gamepad2, Link as LinkIcon, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';

interface PublicProfile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  description: string | null;
  tag: string | null;
  favorite_game: string | null;
  social_link: string | null;
  created_at: string | null;
  rank: UserRank | null;
  xp: number | null;
}

const DEFAULT_AVATAR = 'https://storage.googleapis.com/gpt-engineer-file-uploads/qOyHeK5jWKbzp1GO15zzhMaNTvP2/uploads/1766492041771-IMG_0790.png';

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setProfile(data as PublicProfile);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const displayName = profile?.username || 'Anonymous User';
  const avatarUrl = profile?.avatar_url || DEFAULT_AVATAR;
  const siteUrl = window.location.href;

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Profile... | LokroGames</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Profile Not Found | LokroGames</title>
          <meta property="og:title" content="Profile Not Found | LokroGames" />
          <meta property="og:description" content="This user profile could not be found." />
        </Helmet>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
          <p className="text-muted-foreground">This user doesn't exist or their profile is private.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{displayName} | LokroGames</title>
        <meta property="og:title" content={`${displayName} | LokroGames`} />
        <meta property="og:description" content={profile.description || `Check out ${displayName}'s profile on LokroGames!`} />
        <meta property="og:image" content={avatarUrl} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${displayName} | LokroGames`} />
        <meta name="twitter:description" content={profile.description || `Check out ${displayName}'s profile on LokroGames!`} />
        <meta name="twitter:image" content={avatarUrl} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to LokroGames</span>
            </Link>
            <Button variant="outline" size="sm" onClick={copyProfileLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Share Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center mb-8">
                <Avatar className="h-32 w-32 border-4 border-primary/20 mb-4">
                  <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="bg-muted text-2xl">
                    {profile.username?.[0]?.toUpperCase() || <User className="h-12 w-12 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                
                <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>
                
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {profile.rank && <RankBadge rank={profile.rank} size="md" />}
                  {profile.tag && (
                    <Badge variant="secondary">{profile.tag}</Badge>
                  )}
                </div>

                {profile.xp !== null && (
                  <p className="text-sm text-muted-foreground mt-2">{profile.xp.toLocaleString()} XP</p>
                )}
              </div>

              {/* Description */}
              {profile.description && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">About</h2>
                  <p className="text-foreground">{profile.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.favorite_game && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Favorite Game</p>
                      <p className="text-sm font-medium text-foreground">{profile.favorite_game}</p>
                    </div>
                  </div>
                )}

                {profile.social_link && (
                  <a 
                    href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <LinkIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Social Link</p>
                      <p className="text-sm font-medium text-foreground truncate">{profile.social_link}</p>
                    </div>
                  </a>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PublicProfile;
