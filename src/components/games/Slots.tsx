import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Coins } from 'lucide-react';
import { useBetting } from '@/hooks/useBetting';
import { BetControls } from './BetControls';
import { useToast } from '@/hooks/use-toast';

const SYMBOLS = ['🍒', '🍋', '🔔', '🪙', '💎', '7️⃣'];

function payoutFor(reels: string[], bet: number): { mult: number; label: string } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === '7️⃣') return { mult: 10, label: 'JACKPOT 777' };
    if (a === '🪙') return { mult: 2, label: 'Triple Coin' };
    if (a === '💎') return { mult: 2, label: 'Triple Diamond' };
  }
  return { mult: 0, label: '' };
}

export function Slots() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bet, setBet] = useState(20);
  const [reels, setReels] = useState<string[]>(['❔', '❔', '❔']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);

  const spin = async () => {
    if (!(await placeBet(bet))) return;
    setSpinning(true);
    setLastWin(0);

    // Animate
    for (let i = 0; i < 12; i++) {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      await new Promise((r) => setTimeout(r, 70));
    }

    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];
    setReels(finalReels);

    const { mult, label } = payoutFor(finalReels, bet);
    if (mult > 0) {
      const win = bet * mult;
      await payout(win);
      setLastWin(win);
      toast({ title: label, description: `+${win} credits (×${mult})` });
    } else {
      toast({ title: 'No win', description: `-${bet} credits`, variant: 'destructive' });
    }
    setSpinning(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">SLOTS</h1>
      </div>

      <BetControls bet={bet} setBet={setBet} credits={credits} disabled={spinning || busy} />

      <div className="flex gap-3 rounded-xl border-2 border-neon-orange bg-card p-6 shadow-[0_0_30px_hsl(30,100%,55%,0.4)]">
        {reels.map((s, i) => (
          <div key={i} className="flex h-24 w-20 items-center justify-center rounded-lg border-2 border-border bg-background text-5xl">
            {s}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        <div className="font-display text-sm text-foreground mb-1">Paytable</div>
        <div>7️⃣ 7️⃣ 7️⃣ → <span className="text-neon-orange">×10</span></div>
        <div>🪙 🪙 🪙 → <span className="text-neon-green">×2</span></div>
        <div>💎 💎 💎 → <span className="text-neon-cyan">×2</span></div>
      </div>

      <Button variant="neon" onClick={spin} disabled={spinning || busy || !user}>
        <Coins className="mr-2 h-4 w-4" />
        {spinning ? 'Spinning…' : `Spin (${bet})`}
      </Button>

      {lastWin > 0 && !spinning && (
        <p className="font-display text-xl text-neon-green">Won {lastWin} credits!</p>
      )}
    </div>
  );
}
