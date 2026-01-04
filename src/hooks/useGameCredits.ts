import { useState, useCallback } from 'react';
import { useCredits } from './useCredits';
import { useAuth } from '@/contexts/AuthContext';

interface UseGameCreditsOptions {
  gameSlug: string;
  winScore: number;
}

export const useGameCredits = ({ gameSlug, winScore }: UseGameCreditsOptions) => {
  const { credits, getGameCost, spendCredits, earnCredits, canAffordGame } = useCredits();
  const { user } = useAuth();
  
  const [hasPaid, setHasPaid] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  const gameCost = getGameCost(gameSlug);
  const winAmount = gameCost * 2;

  const payToPlay = useCallback(async (): Promise<boolean> => {
    if (!user) {
      // Require login to play
      return false;
    }
    
    const paid = await spendCredits(gameSlug);
    if (paid) {
      setHasPaid(true);
      setHasWon(false);
    }
    return paid;
  }, [user, spendCredits, gameSlug]);

  const checkWin = useCallback(async (currentScore: number): Promise<boolean> => {
    if (currentScore >= winScore && !hasWon && hasPaid && user) {
      setHasWon(true);
      await earnCredits(winAmount, `Won ${gameSlug} with ${currentScore} points!`);
      return true;
    }
    return false;
  }, [winScore, hasWon, hasPaid, user, winAmount, earnCredits, gameSlug]);

  const resetGameState = useCallback(() => {
    setHasPaid(false);
    setHasWon(false);
  }, []);

  return {
    credits,
    gameCost,
    winAmount,
    winScore,
    hasPaid,
    hasWon,
    user,
    canPlay: user ? canAffordGame(gameSlug) : false,
    payToPlay,
    checkWin,
    resetGameState
  };
};
