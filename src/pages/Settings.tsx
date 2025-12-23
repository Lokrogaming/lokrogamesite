import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Loader2, User, Save, KeyRound, Eye, EyeOff, Gamepad2, Link, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface ExtendedProfile {
  username: string | null;
  avatar_url: string | null;
  description: string | null;
  tag: string | null;
  favorite_game: string | null;
  social_link: string | null;
}

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile?.username || '');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [favoriteGame, setFavoriteGame] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Fetch extended profile data
  useEffect(() => {
    const fetchExtendedProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, description, tag, favorite_game, social_link')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUsername(data.username || '');
        setDescription(data.description || '');
        setTag(data.tag || '');
        setFavoriteGame(data.favorite_game || '');
        setSocialLink(data.social_link || '');
      }
      setLoadingProfile(false);
    };

    fetchExtendedProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Avatar updated!',
        description: 'Your avatar has been changed successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate inputs
    if (description.length > 500) {
      toast({
        title: 'Description too long',
        description: 'Description must be 500 characters or less',
        variant: 'destructive'
      });
      return;
    }

    if (tag.length > 30) {
      toast({
        title: 'Tag too long',
        description: 'Tag must be 30 characters or less',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username.trim() || null,
          description: description.trim() || null,
          tag: tag.trim() || null,
          favorite_game: favoriteGame.trim() || null,
          social_link: socialLink.trim() || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Settings saved!',
        description: 'Your profile has been updated'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordChange = () => {
    const errors: Record<string, string> = {};
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    const newPasswordResult = passwordSchema.safeParse(newPassword);
    if (!newPasswordResult.success) {
      errors.newPassword = newPasswordResult.error.errors[0].message;
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordChange()) return;
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Password change is only available for email accounts',
        variant: 'destructive'
      });
      return;
    }

    setChangingPassword(true);

    try {
      // First verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: 'Password Changed!',
        description: 'Your password has been updated successfully'
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const isEmailUser = user.app_metadata?.provider === 'email' || user.email;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent" />

      <div className="container relative py-8 max-w-md mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <div className="card-gradient border border-border rounded-lg p-6 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h1>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                <AvatarFallback className="bg-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Click to change avatar</p>
          </div>

          {/* Profile Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="bg-background/50"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tag / Status
              </Label>
              <Input
                id="tag"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Pro Gamer, Newbie, Speedrunner"
                className="bg-background/50"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">Shown as a badge on your profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About Me</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell others about yourself..."
                className="bg-background/50 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-game" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Favorite Game
              </Label>
              <Input
                id="favorite-game"
                type="text"
                value={favoriteGame}
                onChange={(e) => setFavoriteGame(e.target.value)}
                placeholder="e.g. Tetris, Snake, 2048"
                className="bg-background/50"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Social Link
              </Label>
              <Input
                id="social-link"
                type="text"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="https://twitter.com/yourprofile"
                className="bg-background/50"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={user.email || ''}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>

          {/* Password Change Section - Only for email users */}
          {isEmailUser && (
            <>
              <Separator className="my-8" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Change Password</h2>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={changingPassword}
                  >
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
