import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface InviteLink {
  id: string;
  code: string;
  uses_count: number;
  is_active: boolean;
  created_at: string;
}

export const useInviteLinks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInviteLinks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('invite_links')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite links:', error);
    } else {
      setInviteLinks(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInviteLinks();
  }, [user]);

  const createInviteLink = async (): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create invite links",
        variant: "destructive"
      });
      return null;
    }

    const { data, error } = await supabase.rpc('create_invite_link');

    if (error) {
      toast({
        title: "Error",
        description: "Could not create invite link",
        variant: "destructive"
      });
      return null;
    }

    toast({
      title: "Invite Link Created!",
      description: "Share your link to earn rewards"
    });

    await fetchInviteLinks();
    return data as string;
  };

  const redeemInviteCode = async (code: string): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase.rpc('redeem_invite_code', { _code: code });

    if (error) {
      console.error('Error redeeming invite code:', error);
      return false;
    }

    return data as boolean;
  };

  const getInviteUrl = (code: string): string => {
    return `${window.location.origin}/invite/${code}`;
  };

  return {
    inviteLinks,
    isLoading,
    createInviteLink,
    redeemInviteCode,
    getInviteUrl,
    refreshLinks: fetchInviteLinks
  };
};
