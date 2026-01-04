import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Package, Coins, Zap, Ticket, Gift, Clock, 
  Sparkles, Check, Loader2, PartyPopper 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ItemType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  effect_type: string | null;
  effect_value: number | null;
  duration_minutes: number | null;
  icon: string;
  rarity: string;
}

interface InventoryItem {
  id: string;
  item_type_id: string;
  quantity: number;
  item_type: ItemType;
}

interface ActiveBooster {
  id: string;
  item_type_id: string;
  expires_at: string;
  item_type: ItemType;
}

const iconMap: Record<string, React.ReactNode> = {
  'Coins': <Coins className="h-5 w-5" />,
  'Zap': <Zap className="h-5 w-5" />,
  'Ticket': <Ticket className="h-5 w-5" />,
  'Gift': <Gift className="h-5 w-5" />,
  'Clover': <Sparkles className="h-5 w-5" />,
};

const rarityColors: Record<string, string> = {
  'common': 'border-slate-500/50 bg-slate-500/10',
  'rare': 'border-blue-500/50 bg-blue-500/10',
  'epic': 'border-purple-500/50 bg-purple-500/10',
  'legendary': 'border-yellow-500/50 bg-yellow-500/10',
};

const Inventory = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeBoosters, setActiveBoosters] = useState<ActiveBooster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [giftCode, setGiftCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  
  // Gift creation state
  const [createGiftOpen, setCreateGiftOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [giftMessage, setGiftMessage] = useState('');
  const [creatingGift, setCreatingGift] = useState(false);
  
  // Birthday reward
  const [birthdayAvailable, setBirthdayAvailable] = useState(false);
  const [claimingBirthday, setClaimingBirthday] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchInventory();
    checkBirthday();
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;
    
    const [inventoryRes, boostersRes] = await Promise.all([
      supabase
        .from('user_inventory')
        .select('id, item_type_id, quantity, item_type:item_types(*)')
        .eq('user_id', user.id),
      supabase
        .from('active_boosters')
        .select('id, item_type_id, expires_at, item_type:item_types(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
    ]);

    if (inventoryRes.data) {
      setInventory(inventoryRes.data as unknown as InventoryItem[]);
    }
    if (boostersRes.data) {
      setActiveBoosters(boostersRes.data as unknown as ActiveBooster[]);
    }
    setLoading(false);
  };

  const checkBirthday = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('birthday, last_birthday_reward')
      .eq('user_id', user.id)
      .single();
    
    if (data?.birthday) {
      const birthday = new Date(data.birthday);
      const today = new Date();
      const lastReward = data.last_birthday_reward ? new Date(data.last_birthday_reward) : null;
      
      if (birthday.getMonth() === today.getMonth() && 
          birthday.getDate() === today.getDate() &&
          (!lastReward || lastReward.getFullYear() < today.getFullYear())) {
        setBirthdayAvailable(true);
      }
    }
  };

  const claimBirthdayReward = async () => {
    setClaimingBirthday(true);
    const { data, error } = await supabase.rpc('claim_birthday_reward');
    
    if (data === true) {
      toast({
        title: "🎂 Happy Birthday!",
        description: "You received 1000 credits as a birthday gift!"
      });
      setBirthdayAvailable(false);
    } else {
      toast({
        title: "Error",
        description: "Could not claim birthday reward",
        variant: "destructive"
      });
    }
    setClaimingBirthday(false);
  };

  const activateBooster = async (itemTypeId: string) => {
    setActivating(itemTypeId);
    const { data, error } = await supabase.rpc('activate_booster', { _item_type_id: itemTypeId });
    
    if (data === true) {
      toast({
        title: "Booster Activated!",
        description: "Your booster is now active"
      });
      fetchInventory();
    } else {
      toast({
        title: "Error",
        description: "Failed to activate booster",
        variant: "destructive"
      });
    }
    setActivating(null);
  };

  const redeemGiftCode = async () => {
    if (!giftCode.trim()) return;
    
    setRedeeming(true);
    const { data, error } = await supabase.rpc('redeem_gift_code', { _code: giftCode.trim() });
    
    const result = data as { success: boolean; error?: string; message?: string } | null;
    
    if (result?.success) {
      toast({
        title: "Gift Redeemed!",
        description: result.message || "Items added to your inventory"
      });
      setGiftCode('');
      fetchInventory();
    } else {
      toast({
        title: "Error",
        description: result?.error || "Invalid gift code",
        variant: "destructive"
      });
    }
    setRedeeming(false);
  };

  const toggleItemForGift = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const updateGiftQuantity = (itemId: string, qty: number, maxQty: number) => {
    if (qty < 1) qty = 1;
    if (qty > maxQty) qty = maxQty;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const createGift = async () => {
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemTypeId, quantity]) => ({ item_type_id: itemTypeId, quantity }));
    
    if (items.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item for the gift",
        variant: "destructive"
      });
      return;
    }
    
    setCreatingGift(true);
    const { data, error } = await supabase.rpc('create_gift_code', {
      _items: items,
      _message: giftMessage || null
    });
    
    if (data) {
      toast({
        title: "Gift Created!",
        description: `Gift code: ${data}. Share it with a friend!`
      });
      setSelectedItems({});
      setGiftMessage('');
      setCreateGiftOpen(false);
      fetchInventory();
    } else {
      toast({
        title: "Error",
        description: "Failed to create gift. Make sure you have enough items.",
        variant: "destructive"
      });
    }
    setCreatingGift(false);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m remaining`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Inventory</h1>
        </div>

        {/* Birthday Reward Banner */}
        {birthdayAvailable && (
          <Card className="mb-6 border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-pink-500/10">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <PartyPopper className="h-10 w-10 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-lg">Happy Birthday! 🎂</h3>
                  <p className="text-muted-foreground">Claim your 1000 credits birthday gift!</p>
                </div>
              </div>
              <Button onClick={claimBirthdayReward} disabled={claimingBirthday}>
                {claimingBirthday ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Claim Gift
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Redeem Gift Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Redeem Gift Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter gift code..."
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={redeemGiftCode} disabled={redeeming || !giftCode.trim()}>
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Redeem
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Boosters */}
        {activeBoosters.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Active Boosters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {activeBoosters.map((booster) => (
                  <div
                    key={booster.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-green-500/50 bg-green-500/10"
                  >
                    <div className="flex items-center gap-3">
                      {iconMap[booster.item_type.icon] || <Gift className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{booster.item_type.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booster.item_type.description}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/50">
                      {getTimeRemaining(booster.expires_at)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Items
              </CardTitle>
              <CardDescription>
                Activate boosters or create gifts from your items
              </CardDescription>
            </div>
            <Dialog open={createGiftOpen} onOpenChange={setCreateGiftOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={inventory.length === 0}>
                  <Gift className="h-4 w-4 mr-2" />
                  Create Gift
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Gift</DialogTitle>
                  <DialogDescription>
                    Select items from your inventory to bundle into a gift code
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <Checkbox
                        checked={!!selectedItems[item.item_type_id]}
                        onCheckedChange={() => toggleItemForGift(item.item_type_id, item.quantity)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.item_type.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Available: {item.quantity}
                        </div>
                      </div>
                      {selectedItems[item.item_type_id] && (
                        <Input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={selectedItems[item.item_type_id]}
                          onChange={(e) => updateGiftQuantity(item.item_type_id, parseInt(e.target.value) || 1, item.quantity)}
                          className="w-20"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Message (optional)</Label>
                  <Textarea
                    placeholder="Add a personal message..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
                <Button onClick={createGift} disabled={creatingGift || Object.keys(selectedItems).length === 0}>
                  {creatingGift ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Gift Code
                </Button>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading inventory...</div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your inventory is empty</p>
                <p className="text-sm">Complete daily challenges to earn boosters!</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${rarityColors[item.item_type.rarity] || rarityColors.common}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {iconMap[item.item_type.icon] || <Gift className="h-5 w-5" />}
                        <span className="font-medium">{item.item_type.name}</span>
                      </div>
                      <Badge variant="outline">x{item.quantity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.item_type.description}
                    </p>
                    {item.item_type.category === 'booster' || item.item_type.category === 'consumable' ? (
                      <Button
                        size="sm"
                        onClick={() => activateBooster(item.item_type_id)}
                        disabled={activating === item.item_type_id}
                        className="w-full"
                      >
                        {activating === item.item_type_id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Activate
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;
