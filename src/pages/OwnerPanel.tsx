import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Users, Medal, Coins, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RankManagementTab } from '@/components/owner/RankManagementTab';
import { AccountManagementTab } from '@/components/owner/AccountManagementTab';
import { CreditEditorTab } from '@/components/owner/CreditEditorTab';
import { AdminVoucherSystem } from '@/components/AdminVoucherSystem';

const OwnerPanel = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkOwnerRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      setIsOwner(!!data);
      setCheckingRole(false);
    };

    if (!isLoading) {
      checkOwnerRole();
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading && !checkingRole) {
      if (!user) {
        navigate('/auth');
      } else if (!isOwner) {
        navigate('/');
      }
    }
  }, [user, isOwner, isLoading, checkingRole, navigate]);

  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-gold" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Owner Panel
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            Manage ranks, accounts, and credits
          </p>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="ranks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="ranks" className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Ranks
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Vouchers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranks">
            <RankManagementTab />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountManagementTab />
          </TabsContent>

          <TabsContent value="credits">
            <CreditEditorTab />
          </TabsContent>

          <TabsContent value="vouchers">
            <AdminVoucherSystem />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerPanel;
