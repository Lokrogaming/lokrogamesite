import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const MIN_BET = 5;
export const MAX_BET = 5000;

export const useBetting = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const validate = (bet: number): boolean => {
    if (!user || !profile) {
      toast({ title: 'Login required', description: 'Please login to bet.', variant: 'destructive' });
      return false;
    }
    if (!Number.isFinite(bet) || bet < MIN_BET || bet > MAX_BET) {
      toast({ title: 'Invalid bet', description: `Bet must be ${MIN_BET}–${MAX_BET} credits.`, variant: 'destructive' });
      return false;
    }
    if (profile.credits < bet) {
      toast({ title: 'Insufficient credits', description: `You have ${profile.credits} credits.`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const placeBet = useCallback(async (bet: number): Promise<boolean> => {
    if (!validate(bet)) return false;
    setBusy(true);
    const { data, error } = await supabase.rpc('spend_credits', { _amount: bet, _reason: 'casino_bet' });
    setBusy(false);
    if (error || data === false) {
      toast({ title: 'Bet failed', description: error?.message ?? 'Insufficient credits.', variant: 'destructive' });
      return false;
    }
    await refreshProfile();
    return true;
  }, [user, profile]);

  const payout = useCallback(async (amount: number): Promise<void> => {
    if (amount <= 0) return;
    // earn_credits is capped at 10000 per call; chunk if needed
    let remaining = Math.floor(amount);
    while (remaining > 0) {
      const chunk = Math.min(remaining, 10000);
      const { error } = await supabase.rpc('earn_credits', { _amount: chunk, _reason: 'casino_win' });
      if (error) {
        toast({ title: 'Payout error', description: error.message, variant: 'destructive' });
        break;
      }
      remaining -= chunk;
    }
    await refreshProfile();
  }, []);

  return { placeBet, payout, busy, credits: profile?.credits ?? 0, user };
};
