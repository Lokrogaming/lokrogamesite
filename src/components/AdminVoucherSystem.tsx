import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Gift, Loader2, Copy, Check, Trash2, Users, Zap, Coins } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SpecialVoucher {
  id: string;
  code: string;
  credits_amount: number;
  xp_amount: number;
  max_uses: number | null;
  current_uses: number;
  one_use_per_user: boolean;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export const AdminVoucherSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [vouchers, setVouchers] = useState<SpecialVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [oneUsePerUser, setOneUsePerUser] = useState(true);
  const [expiresIn, setExpiresIn] = useState(''); // days

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('special_vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setVouchers(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!code.trim()) {
      toast({ title: 'Error', description: 'Code is required', variant: 'destructive' });
      return;
    }

    const credits = parseInt(creditsAmount) || 0;
    const xp = parseInt(xpAmount) || 0;
    const uses = maxUses ? parseInt(maxUses) : null;
    const expires = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString() : null;

    if (credits === 0 && xp === 0) {
      toast({ title: 'Error', description: 'Add credits or XP amount', variant: 'destructive' });
      return;
    }

    setCreating(true);
    
    const { error } = await supabase
      .from('special_vouchers')
      .insert({
        creator_id: user!.id,
        code: code.toUpperCase().trim(),
        credits_amount: credits,
        xp_amount: xp,
        max_uses: uses,
        one_use_per_user: oneUsePerUser,
        expires_at: expires
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Special voucher created!' });
      setCode('');
      setCreditsAmount('');
      setXpAmount('');
      setMaxUses('');
      setExpiresIn('');
      fetchVouchers();
    }
    
    setCreating(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase
      .from('special_vouchers')
      .update({ is_active: !isActive })
      .eq('id', id);
    fetchVouchers();
  };

  const deleteVoucher = async (id: string) => {
    await supabase
      .from('special_vouchers')
      .delete()
      .eq('id', id);
    fetchVouchers();
    toast({ title: 'Deleted', description: 'Voucher removed' });
  };

  const copyCode = (voucherCode: string) => {
    navigator.clipboard.writeText(voucherCode);
    setCopiedCode(voucherCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Admin Special Vouchers
        </CardTitle>
        <CardDescription>
          Create custom vouchers with XP, credits, and usage limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Form */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SPECIAL100"
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="xp">XP</Label>
            <Input
              id="xp"
              type="number"
              value={xpAmount}
              onChange={(e) => setXpAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxUses">Max Uses (empty = unlimited)</Label>
            <Input
              id="maxUses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="∞"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expires">Expires In (days)</Label>
            <Input
              id="expires"
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              placeholder="Never"
            />
          </div>
          
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="oneUse"
              checked={oneUsePerUser}
              onCheckedChange={setOneUsePerUser}
            />
            <Label htmlFor="oneUse">One use per user</Label>
          </div>
          
          <div className="col-span-2 md:col-span-3">
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Gift className="mr-2 h-4 w-4" />
              Create Special Voucher
            </Button>
          </div>
        </div>

        {/* Vouchers List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : vouchers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No special vouchers yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Rewards</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold">{v.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(v.code)}>
                        {copiedCode === v.code ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {v.credits_amount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Coins className="h-3 w-3" />
                          {v.credits_amount}
                        </Badge>
                      )}
                      {v.xp_amount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {v.xp_amount}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {v.current_uses}/{v.max_uses ?? '∞'}
                      {v.one_use_per_user && (
                        <Badge variant="secondary" className="text-xs ml-1">1/user</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={v.is_active}
                      onCheckedChange={() => toggleActive(v.id, v.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteVoucher(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};