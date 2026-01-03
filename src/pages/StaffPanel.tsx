import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Users, MessageSquare, ArrowLeft, Crown, Bot } from 'lucide-react';
import GameSubmissionsTab from '@/components/staff/GameSubmissionsTab';
import UserManagementTab from '@/components/staff/UserManagementTab';
import StaffChatTab from '@/components/staff/StaffChatTab';
import { AdminVoucherSystem } from '@/components/AdminVoucherSystem';
import { AutomodLogsTab } from '@/components/staff/AutomodLogsTab';
import { supabase } from '@/integrations/supabase/client';

const StaffPanel = () => {
  const { user, isStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submissions');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      navigate('/');
    }
  }, [user, isStaff, isLoading, navigate]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground font-display text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="font-display text-2xl font-bold text-gradient">Staff Panel</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full grid mb-8 bg-card border border-border ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger 
              value="submissions" 
              className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-4 h-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="automod" 
              className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bot className="w-4 h-4 mr-2" />
              Automod
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Staff Chat
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="vouchers" 
                className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Crown className="w-4 h-4 mr-2" />
                Vouchers
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="submissions">
            <GameSubmissionsTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="automod">
            <AutomodLogsTab />
          </TabsContent>

          <TabsContent value="chat">
            <StaffChatTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="vouchers">
              <AdminVoucherSystem />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default StaffPanel;