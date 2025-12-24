import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Ticket, Loader2, Copy, Check } from 'lucide-react';

export const VoucherSystem = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Create voucher state
  const [createAmount, setCreateAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Redeem voucher state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const calculateTax = (amount: number) => Math.ceil(amount * 0.1);
  const calculateTotal = (amount: number) => amount + calculateTax(amount);

  const handleCreateVoucher = async () => {
    const amount = parseInt(createAmount);
    
    if (isNaN(amount) || amount < 10 || amount > 10000) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be between 10 and 10,000 credits',
        variant: 'destructive'
      });
      return;
    }

    const totalCost = calculateTotal(amount);
    if (!profile || profile.credits < totalCost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${totalCost} credits (${amount} + ${calculateTax(amount)} tax)`,
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_voucher', { _amount: amount });
      
      if (error) throw error;
      
      setGeneratedCode(data);
      await refreshProfile();
      
      toast({
        title: 'Voucher Created!',
        description: `Your ${amount} credit voucher is ready`
      });
      
      setCreateAmount('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create voucher',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!redeemCode.trim()) {
      toast({
        title: 'Enter Code',
        description: 'Please enter a voucher code',
        variant: 'destructive'
      });
      return;
    }

    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_voucher', { _code: redeemCode.trim() });
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: 'Voucher Redeemed!',
        description: `+${data} credits added to your account`
      });
      
      setRedeemCode('');
    } catch (error: any) {
      toast({
        title: 'Redemption Failed',
        description: error.message || 'Invalid or already redeemed code',
        variant: 'destructive'
      });
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const amount = parseInt(createAmount) || 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Credit Vouchers
        </CardTitle>
        <CardDescription>
          Create vouchers to gift credits to others, or redeem codes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4 mt-4">
            {generatedCode ? (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Voucher Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-mono font-bold text-primary tracking-wider">
                      {generatedCode}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyCode}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setGeneratedCode(null)}
                >
                  Create Another
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="create-amount">Amount</Label>
                  <Input
                    id="create-amount"
                    type="number"
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    placeholder="Enter amount (10-10,000)"
                    min={10}
                    max={10000}
                  />
                </div>
                
                {amount >= 10 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voucher Value</span>
                      <span>{amount} credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span className="text-destructive">+{calculateTax(amount)} credits</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border">
                      <span>Total Cost</span>
                      <span>{calculateTotal(amount)} credits</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleCreateVoucher} 
                  disabled={creating || amount < 10}
                  className="w-full"
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Ticket className="mr-2 h-4 w-4" />
                  Create Voucher
                </Button>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="redeem" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="redeem-code">Voucher Code</Label>
              <Input
                id="redeem-code"
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                className="font-mono tracking-wider"
                maxLength={8}
              />
            </div>
            
            <Button 
              onClick={handleRedeemVoucher} 
              disabled={redeeming || !redeemCode.trim()}
              className="w-full"
            >
              {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Gift className="mr-2 h-4 w-4" />
              Redeem Voucher
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
