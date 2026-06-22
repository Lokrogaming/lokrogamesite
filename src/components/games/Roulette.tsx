import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw } from 'lucide-react';
import { useBetting, MIN_BET, MAX_BET } from '@/hooks/useBetting';
import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type BetKey = 'red' | 'black' | 'odd' | 'even';

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function isRed(n: number) { return RED.has(n); }
function isBlack(n: number) { return n !== 0 && !RED.has(n); }

export function Roulette() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bets, setBets] = useState<Record<BetKey, number>>({ red: 0, black: 0, odd: 0, even: 0 });
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const setBet = (k: BetKey, v: number) => {
    const clamped = Math.max(0, Math.min(MAX_BET, Math.floor(v) || 0));
    setBets((b) => ({ ...b, [k]: clamped }));
  };

  const spin = async () => {
    if (totalBet < MIN_BET) {
      toast({ title: 'Place a bet', description: `Minimum total bet is ${MIN_BET}`, variant: 'destructive' });
      return;
    }
    if (totalBet > credits) {
      toast({ title: 'Insufficient credits', variant: 'destructive' });
      return;
    }
    setSpinning(true);
    setResult(null);
    setLastWin(null);
    if (!(await placeBet(totalBet))) { setSpinning(false); return; }

    const number = Math.floor(Math.random() * 37); // 0-36
    await new Promise((r) => setTimeout(r, 1200));
    setResult(number);

    let win = 0;
    if (bets.red > 0 && isRed(number)) win += Math.floor(bets.red * 1.5);
    if (bets.black > 0 && isBlack(number)) win += Math.floor(bets.black * 1.5);
    if (bets.odd > 0 && number !== 0 && number % 2 === 1) win += Math.floor(bets.odd * 1.5);
    if (bets.even > 0 && number !== 0 && number % 2 === 0) win += Math.floor(bets.even * 1.5);

    if (win > 0) await payout(win);
    setLastWin(win);
    setSpinning(false);
    toast({
      title: `Landed on ${number} (${number === 0 ? 'green' : isRed(number) ? 'red' : 'black'})`,
      description: win > 0 ? `+${win} credits` : `-${totalBet} credits`,
      variant: win > 0 ? 'default' : 'destructive',
    });
  };

  const reset = () => {
    setBets({ red: 0, black: 0, odd: 0, even: 0 });
    setResult(null);
    setLastWin(null);
  };

  const color = result === null ? '' : result === 0 ? 'text-neon-green' : isRed(result) ? 'text-red-500' : 'text-foreground';

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">ROULETTE</h1>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-neon-orange">
        <Coins className="h-4 w-4" /> <span className="font-display">{credits}</span>
      </div>

      <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 ${result === null ? 'border-border' : result === 0 ? 'border-neon-green' : isRed(result) ? 'border-red-500' : 'border-foreground'} bg-card`}>
        <span className={`font-display text-5xl ${color}`}>
          {spinning ? '…' : result ?? '?'}
        </span>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {(['red', 'black', 'odd', 'even'] as BetKey[]).map((k) => (
          <div key={k} className={`rounded-lg border-2 p-3 ${
            k === 'red' ? 'border-red-500/60' : k === 'black' ? 'border-foreground/40' : 'border-neon-cyan/50'
          }`}>
            <div className="mb-2 font-display text-sm uppercase">{k} <span className="text-muted-foreground">×1.5</span></div>
            <Input
              type="number"
              min={0}
              max={MAX_BET}
              value={bets[k]}
              disabled={spinning}
              onChange={(e) => setBet(k, parseInt(e.target.value || '0', 10))}
              className="h-8"
            />
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">Total bet: <span className="text-neon-orange">{totalBet}</span></div>

      <div className="flex gap-2">
        <Button variant="neon" onClick={spin} disabled={spinning || busy || !user || totalBet === 0}>
          {spinning ? 'Spinning…' : 'Spin'}
        </Button>
        <Button variant="outline" onClick={reset} disabled={spinning}>
          <RotateCcw className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>

      {lastWin !== null && (
        <p className={`font-display text-xl ${lastWin > 0 ? 'text-neon-green' : 'text-neon-magenta'}`}>
          {lastWin > 0 ? `Won ${lastWin} credits!` : 'No winning bets'}
        </p>
      )}
    </div>
  );
}
