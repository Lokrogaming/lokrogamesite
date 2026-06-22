import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Coins } from 'lucide-react';
import { useBetting } from '@/hooks/useBetting';
import { BetControls } from './BetControls';
import { useToast } from '@/hooks/use-toast';

type Side = 'heads' | 'tails';

export function Coinflip() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<Side>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const flip = async () => {
    if (!(await placeBet(bet))) return;
    setFlipping(true);
    setResult(null);
    setLastWin(null);
    await new Promise((r) => setTimeout(r, 900));
    const outcome: Side = Math.random() < 0.5 ? 'heads' : 'tails';
    setResult(outcome);
    if (outcome === pick) {
      const win = bet * 2;
      await payout(win);
      setLastWin(win);
      toast({ title: `${outcome.toUpperCase()}!`, description: `+${win} credits` });
    } else {
      setLastWin(0);
      toast({ title: `${outcome.toUpperCase()}`, description: `-${bet} credits`, variant: 'destructive' });
    }
    setFlipping(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">COINFLIP</h1>
      </div>

      <BetControls bet={bet} setBet={setBet} credits={credits} disabled={flipping || busy} />

      <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 border-neon-orange bg-card text-5xl ${flipping ? 'animate-spin' : ''}`}>
        {result === 'heads' ? '👑' : result === 'tails' ? '🪙' : '?'}
      </div>

      <div className="flex gap-3">
        {(['heads', 'tails'] as Side[]).map((s) => (
          <button
            key={s}
            disabled={flipping}
            onClick={() => setPick(s)}
            className={`rounded-lg border-2 px-6 py-3 font-display uppercase transition ${
              pick === s ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' : 'border-border bg-card hover:border-primary'
            }`}
          >
            {s === 'heads' ? '👑 Heads' : '🪙 Tails'}
          </button>
        ))}
      </div>

      <Button variant="neon" onClick={flip} disabled={flipping || busy || !user}>
        <Coins className="mr-2 h-4 w-4" />
        {flipping ? 'Flipping…' : `Flip (${bet})`}
      </Button>

      {lastWin !== null && !flipping && (
        <p className={`font-display text-xl ${lastWin > 0 ? 'text-neon-green' : 'text-neon-magenta'}`}>
          {lastWin > 0 ? `Won ${lastWin} credits!` : 'You lost'}
        </p>
      )}
    </div>
  );
}
