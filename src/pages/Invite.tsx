import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Users, Coins, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Invite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [creatorName, setCreatorName] = useState<string>('');

  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setIsValidCode(false);
        return;
      }

      const { data: inviteData, error } = await supabase
        .from('invite_links')
        .select('creator_id')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !inviteData) {
        setIsValidCode(false);
        return;
      }

      // Get creator's username
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('username')
        .eq('user_id', inviteData.creator_id)
        .single();

      if (profileData?.username) {
        setCreatorName(profileData.username);
      }

      setIsValidCode(true);

      // Store the invite code in sessionStorage for after registration
      sessionStorage.setItem('pendingInviteCode', code);
    };

    validateCode();
  }, [code]);

  const handleSignUp = () => {
    navigate('/auth?mode=signup');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  if (isValidCode === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            {creatorName ? (
              <><span className="font-semibold text-foreground">{creatorName}</span> invited you to join</>
            ) : (
              'You have been invited to join'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-center mb-3">Sign up and get:</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">200 Credits</p>
                <p className="text-sm text-muted-foreground">Play more games</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">500 XP</p>
                <p className="text-sm text-muted-foreground">Boost your rank</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Your friend gets rewards too!</p>
                <p className="text-sm text-muted-foreground">Both of you benefit</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignUp} className="w-full" size="lg">
              Create Account
            </Button>
            <Button onClick={handleLogin} variant="outline" className="w-full">
              Already have an account? Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
