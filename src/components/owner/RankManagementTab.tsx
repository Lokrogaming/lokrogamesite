import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Medal } from 'lucide-react';

interface RankConfig {
  id: string;
  rank_key: string;
  display_name: string;
  xp_threshold: number;
  color_class: string;
  icon_name: string;
  sort_order: number;
}

export const RankManagementTab = () => {
  const [ranks, setRanks] = useState<RankConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<RankConfig | null>(null);
  const [formData, setFormData] = useState({
    rank_key: '',
    display_name: '',
    xp_threshold: 0,
    color_class: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    icon_name: 'Medal',
    sort_order: 0
  });

  const fetchRanks = async () => {
    const { data, error } = await supabase
      .from('rank_configs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch ranks', variant: 'destructive' });
    } else {
      setRanks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRank) {
      const { error } = await supabase
        .from('rank_configs')
        .update({
          display_name: formData.display_name,
          xp_threshold: formData.xp_threshold,
          color_class: formData.color_class,
          icon_name: formData.icon_name,
          sort_order: formData.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRank.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Rank updated successfully' });
        fetchRanks();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('rank_configs')
        .insert({
          rank_key: formData.rank_key.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          xp_threshold: formData.xp_threshold,
          color_class: formData.color_class,
          icon_name: formData.icon_name,
          sort_order: formData.sort_order
        });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Rank created successfully' });
        fetchRanks();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (rank: RankConfig) => {
    if (!confirm(`Are you sure you want to delete the "${rank.display_name}" rank?`)) return;

    const { error } = await supabase
      .from('rank_configs')
      .delete()
      .eq('id', rank.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Rank deleted successfully' });
      fetchRanks();
    }
  };

  const resetForm = () => {
    setFormData({
      rank_key: '',
      display_name: '',
      xp_threshold: 0,
      color_class: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
      icon_name: 'Medal',
      sort_order: 0
    });
    setEditingRank(null);
  };

  const openEditDialog = (rank: RankConfig) => {
    setEditingRank(rank);
    setFormData({
      rank_key: rank.rank_key,
      display_name: rank.display_name,
      xp_threshold: rank.xp_threshold,
      color_class: rank.color_class,
      icon_name: rank.icon_name,
      sort_order: rank.sort_order
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading ranks...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Rank Management
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRank ? 'Edit Rank' : 'Create New Rank'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingRank && (
                <div>
                  <Label htmlFor="rank_key">Rank Key</Label>
                  <Input
                    id="rank_key"
                    value={formData.rank_key}
                    onChange={(e) => setFormData({ ...formData, rank_key: e.target.value })}
                    placeholder="e.g. mythic"
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Mythic"
                  required
                />
              </div>
              <div>
                <Label htmlFor="xp_threshold">XP Threshold</Label>
                <Input
                  id="xp_threshold"
                  type="number"
                  value={formData.xp_threshold}
                  onChange={(e) => setFormData({ ...formData, xp_threshold: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color_class">Color Class</Label>
                <Input
                  id="color_class"
                  value={formData.color_class}
                  onChange={(e) => setFormData({ ...formData, color_class: e.target.value })}
                  placeholder="e.g. bg-purple-500/20 text-purple-500 border-purple-500/30"
                />
              </div>
              <div>
                <Label htmlFor="icon_name">Icon Name</Label>
                <Input
                  id="icon_name"
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                  placeholder="e.g. Crown, Medal, Trophy, Gem, Sparkles"
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRank ? 'Update Rank' : 'Create Rank'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>XP Required</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranks.map((rank) => (
              <TableRow key={rank.id}>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${rank.color_class}`}>
                    {rank.display_name}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{rank.rank_key}</TableCell>
                <TableCell>{rank.xp_threshold.toLocaleString()}</TableCell>
                <TableCell>{rank.sort_order}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rank)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rank)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
