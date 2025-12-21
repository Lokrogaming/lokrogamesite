import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import GameSubmissionsTab from '@/components/staff/GameSubmissionsTab';
import UserManagementTab from '@/components/staff/UserManagementTab';
import StaffChatTab from '@/components/staff/StaffChatTab';

const StaffPanel = () => {
  const { user, isStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      navigate('/');
    }
  }, [user, isStaff, isLoading, navigate]);

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
          <TabsList className="w-full grid grid-cols-3 mb-8 bg-card border border-border">
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
              value="chat" 
              className="font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Staff Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <GameSubmissionsTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="chat">
            <StaffChatTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StaffPanel;
