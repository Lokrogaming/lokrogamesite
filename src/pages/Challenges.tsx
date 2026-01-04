import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges } from '@/hooks/useChallenges';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, Coins, Target, CheckCircle2, Clock, Gift } from 'lucide-react';

const Challenges = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { challenges, loading, completedCount, maxChallenges } = useChallenges();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const progress = maxChallenges > 0 ? (completedCount / maxChallenges) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-green/5 to-transparent" />

      <div className="container relative py-8 max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <div className="card-gradient border border-border rounded-lg p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-neon-orange" />
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Daily Challenges</h1>
                <p className="text-sm text-muted-foreground">Complete challenges to earn bonus credits</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <Coins className="h-4 w-4 text-neon-orange" />
              <span className="font-display text-sm text-neon-orange">{profile?.credits ?? 0}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-display text-foreground">{completedCount}/{maxChallenges}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="card-gradient border border-border rounded-lg p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">No Challenges Today</h2>
            <p className="text-muted-foreground">Check back tomorrow for new challenges!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`card-gradient border rounded-lg p-5 transition-all ${
                  challenge.completed
                    ? 'border-neon-green/50 bg-neon-green/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${challenge.completed ? 'bg-neon-green/20' : 'bg-muted'}`}>
                      {challenge.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-neon-green" />
                      ) : (
                        <Target className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-display text-lg font-bold ${
                        challenge.completed ? 'text-neon-green' : 'text-foreground'
                      }`}>
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                      {challenge.target_score && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Target Score: {challenge.target_score.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-neon-orange/20">
                      <Coins className="h-4 w-4 text-neon-orange" />
                      <span className="font-display text-sm text-neon-orange">+{challenge.reward_credits}</span>
                    </div>
                    {challenge.reward_item_name && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-neon-cyan/20">
                        <Gift className="h-4 w-4 text-neon-cyan" />
                        <span className="font-display text-xs text-neon-cyan">
                          +{challenge.reward_item_quantity || 1}x {challenge.reward_item_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
