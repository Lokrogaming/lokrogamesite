import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
  last_credit_refill: string | null;
  daily_challenges_completed: number;
  last_challenge_reset: string | null;
  address_number: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isStaff: boolean;
  isOwner: boolean;
  signUp: (email: string, password: string, username?: string, birthday?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCredits: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setProfile(data as Profile);
    }
  };

  const checkStaffRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (data) {
      const staffRoles = ['staff', 'admin', 'moderator', 'owner'];
      setIsStaff(data.some(r => staffRoles.includes(r.role)));
      setIsOwner(data.some(r => r.role === 'owner'));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkStaffRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsStaff(false);
          setIsOwner(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkStaffRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string, birthday?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username, birthday }
      }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsStaff(false);
    setIsOwner(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateCredits = async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;
    
    try {
      if (amount < 0) {
        // Spending credits - use secure RPC function
        const { data, error } = await supabase.rpc('spend_credits', {
          _amount: Math.abs(amount),
          _reason: 'game_play'
        });
        
        if (error) {
          console.error('Failed to spend credits:', error.message);
          return false;
        }
        
        if (data === false) {
          // Insufficient credits
          return false;
        }
      } else {
        // Earning credits - use secure RPC function
        const { error } = await supabase.rpc('earn_credits', {
          _amount: amount,
          _reason: 'reward'
        });
        
        if (error) {
          console.error('Failed to earn credits:', error.message);
          return false;
        }
      }
      
      // Refresh profile to get updated credits
      await refreshProfile();
      return true;
    } catch (error) {
      console.error('Credit update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isStaff,
      isOwner,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      updateCredits
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
