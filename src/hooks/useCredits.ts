import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import creditsConfig from '@/JSON/credits.json';

export const useCredits = () => {
  const { profile, updateCredits } = useAuth();
  const { toast } = useToast();

  const getGameCost = (gameSlug: string): number => {
    const costs = creditsConfig.gameCosts as Record<string, number>;
    return costs[gameSlug] || 5;
  };

  const canAffordGame = (gameSlug: string): boolean => {
    if (!profile) return false;
    const cost = getGameCost(gameSlug);
    return profile.credits >= cost;
  };

  const spendCredits = async (gameSlug: string): Promise<boolean> => {
    if (!profile) {
      toast({
        title: "Login Required",
        description: "Please login to play games",
        variant: "destructive"
      });
      return false;
    }

    const cost = getGameCost(gameSlug);
    
    if (profile.credits < cost) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${cost} credits to play this game. You have ${profile.credits}.`,
        variant: "destructive"
      });
      return false;
    }

    await updateCredits(-cost);
    return true;
  };

  const earnCredits = async (amount: number, reason: string) => {
    await updateCredits(amount);
    toast({
      title: "Credits Earned!",
      description: `+${amount} credits: ${reason}`
    });
  };

  return {
    credits: profile?.credits ?? 0,
    getGameCost,
    canAffordGame,
    spendCredits,
    earnCredits,
    dailyCredits: creditsConfig.dailyCredits,
    maxChallenges: creditsConfig.maxDailyChallenges
  };
};
