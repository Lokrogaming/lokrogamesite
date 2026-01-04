import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveBooster {
  id: string;
  item_type_id: string;
  expires_at: string;
  effect_type: string;
  effect_value: number;
}

export const useInventory = () => {
  const { user } = useAuth();
  const [activeBoosters, setActiveBoosters] = useState<ActiveBooster[]>([]);
  const [hasFreePlay, setHasFreePlay] = useState(false);
  const [creditMultiplier, setCreditMultiplier] = useState(1);
  const [xpMultiplier, setXpMultiplier] = useState(1);

  const fetchActiveBoosters = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('active_boosters')
      .select(`
        id,
        item_type_id,
        expires_at,
        item_type:item_types(effect_type, effect_value)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (data) {
      const boosters = data.map((b: any) => ({
        id: b.id,
        item_type_id: b.item_type_id,
        expires_at: b.expires_at,
        effect_type: b.item_type?.effect_type,
        effect_value: b.item_type?.effect_value
      }));
      
      setActiveBoosters(boosters);
      
      // Calculate multipliers
      let credits = 1;
      let xp = 1;
      let freePlay = false;
      
      boosters.forEach(b => {
        if (b.effect_type === 'credit_multiplier') {
          credits = Math.max(credits, b.effect_value || 1);
        }
        if (b.effect_type === 'xp_multiplier') {
          xp = Math.max(xp, b.effect_value || 1);
        }
        if (b.effect_type === 'free_play') {
          freePlay = true;
        }
      });
      
      setCreditMultiplier(credits);
      setXpMultiplier(xp);
      setHasFreePlay(freePlay);
    }
  }, [user]);

  const consumeFreePlay = useCallback(async () => {
    if (!user || !hasFreePlay) return false;

    // Find and deactivate a free play booster
    const freePlayBooster = activeBoosters.find(b => b.effect_type === 'free_play');
    if (!freePlayBooster) return false;

    const { error } = await supabase
      .from('active_boosters')
      .update({ is_active: false })
      .eq('id', freePlayBooster.id);

    if (!error) {
      await fetchActiveBoosters();
      return true;
    }
    return false;
  }, [user, hasFreePlay, activeBoosters, fetchActiveBoosters]);

  useEffect(() => {
    fetchActiveBoosters();
    
    // Refresh every minute to check for expired boosters
    const interval = setInterval(fetchActiveBoosters, 60000);
    return () => clearInterval(interval);
  }, [fetchActiveBoosters]);

  return {
    activeBoosters,
    hasFreePlay,
    creditMultiplier,
    xpMultiplier,
    consumeFreePlay,
    refreshBoosters: fetchActiveBoosters
  };
};
