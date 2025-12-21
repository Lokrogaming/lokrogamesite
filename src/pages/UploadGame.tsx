import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Loader2, Code, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { Database } from '@/integrations/supabase/types';

type GameCategory = Database['public']['Enums']['game_category'];

const gameSubmissionSchema = z.object({
  gameName: z.string().min(3, 'Game name must be at least 3 characters').max(50, 'Game name must be less than 50 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['arcade', 'puzzle', 'card', 'strategy', 'idle', 'multiplayer']),
  gameCode: z.string().min(100, 'Game code is too short').max(100000, 'Game code is too long'),
});

const UploadGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [gameName, setGameName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GameCategory>('arcade');
  const [gameCode, setGameCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = gameSubmissionSchema.safeParse({ gameName, description, category, gameCode });
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to submit a game',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('game_submissions')
        .insert({
          user_id: user.id,
          game_name: gameName.trim(),
          description: description.trim(),
          category,
          game_code: gameCode,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Game Submitted!',
        description: 'Your game has been submitted for review. Our staff will review it soon.'
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit game. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 to-transparent" />

      <div className="container relative py-8 max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <div className="card-gradient border border-border rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-8 w-8 text-neon-purple" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Submit a Game</h1>
              <p className="text-sm text-muted-foreground">Share your game with the community</p>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-neon-orange flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Submission Guidelines</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Games must be original or properly licensed</li>
                  <li>Code must be a valid React component</li>
                  <li>Games will be reviewed by staff before publishing</li>
                  <li>No inappropriate content or malicious code</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameName">Game Name</Label>
              <Input
                id="gameName"
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter your game's name"
                className="bg-background/50"
                maxLength={50}
              />
              {errors.gameName && (
                <p className="text-sm text-destructive">{errors.gameName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your game, how to play, etc."
                className="bg-background/50 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as GameCategory)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arcade">Arcade</SelectItem>
                  <SelectItem value="puzzle">Puzzle</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="multiplayer">Multiplayer</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameCode" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Game Code (React Component)
              </Label>
              <Textarea
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                placeholder={`Paste your React component code here...

Example:
export const MyGame = () => {
  return (
    <div>Your game here</div>
  );
};`}
                className="bg-background/50 min-h-[300px] font-mono text-sm"
              />
              {errors.gameCode && (
                <p className="text-sm text-destructive">{errors.gameCode}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-neon-purple text-primary-foreground hover:bg-neon-purple/90"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Submit Game for Review
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadGame;
