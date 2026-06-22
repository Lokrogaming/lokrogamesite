import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw, Coins, Heart } from 'lucide-react';
import { useBetting } from '@/hooks/useBetting';
import { BetControls } from './BetControls';
import { useToast } from '@/hooks/use-toast';

const TOTAL = 50;
const SAFE = 5;
const LIVES = 2;

type Phase = 'betting' | 'playing' | 'won' | 'lost';

function freshBoard(): Set<number> {
  const safe = new Set<number>();
  while (safe.size < SAFE) safe.add(Math.floor(Math.random() * TOTAL));
  return safe;
}

export function PickACard() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bet, setBet] = useState(20);
  const [phase, setPhase] = useState<Phase>('betting');
  const [safeSet, setSafeSet] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Record<number, 'safe' | 'mine'>>({});
  const [lives, setLives] = useState(LIVES);

  const start = async () => {
    if (!(await placeBet(bet))) return;
    setSafeSet(freshBoard());
    setRevealed({});
    setLives(LIVES);
    setPhase('playing');
  };

  const reset = () => {
    setPhase('betting');
    setRevealed({});
  };

  const pick = async (i: number) => {
    if (phase !== 'playing' || revealed[i] !== undefined) return;
    const isSafe = safeSet.has(i);
    setRevealed((r) => ({ ...r, [i]: isSafe ? 'safe' : 'mine' }));
    if (isSafe) {
      setPhase('won');
      const win = bet * 2;
      await payout(win);
      toast({ title: 'Safe card!', description: `+${win} credits` });
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase('lost');
        toast({ title: 'Out of lives', description: `You lost ${bet} credits`, variant: 'destructive' });
      } else {
        toast({ title: 'Mine!', description: `${newLives} life left` });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4">
      <div className="flex w-full max-w-3xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">PICK-A-CARD</h1>
      </div>

      <BetControls bet={bet} setBet={setBet} credits={credits} disabled={phase === 'playing' || busy} />

      <div className="flex items-center gap-4 font-display">
        <span className="text-neon-cyan">Safe: {SAFE}/{TOTAL}</span>
        <span className="flex items-center gap-1 text-neon-magenta">
          {Array.from({ length: LIVES }).map((_, i) => (
            <Heart key={i} className={`h-5 w-5 ${i < lives ? 'fill-current' : 'opacity-20'}`} />
          ))}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const state = revealed[i];
          const showMine = phase === 'lost' && !safeSet.has(i);
          const showSafe = (phase === 'lost' || phase === 'won') && safeSet.has(i);
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={phase !== 'playing' || state !== undefined}
              className={`h-14 w-14 rounded-md border-2 font-display text-lg transition-all ${
                state === 'safe' || showSafe
                  ? 'border-neon-green bg-neon-green/20 text-neon-green'
                  : state === 'mine' || showMine
                  ? 'border-neon-magenta bg-neon-magenta/20 text-neon-magenta'
                  : 'border-border bg-card hover:border-primary hover:scale-105'
              }`}
            >
              {state === 'safe' || showSafe ? <Coins className="mx-auto h-5 w-5" /> : state === 'mine' || showMine ? '💣' : '?'}
            </button>
          );
        })}
      </div>

      {phase === 'betting' && (
        <Button variant="neon" onClick={start} disabled={busy || !user}>
          {user ? `Place Bet (${bet})` : 'Login to play'}
        </Button>
      )}
      {(phase === 'won' || phase === 'lost') && (
        <div className="flex flex-col items-center gap-3">
          <p className={`font-display text-2xl ${phase === 'won' ? 'text-neon-green' : 'text-neon-magenta'}`}>
            {phase === 'won' ? `You won ${bet * 2} credits!` : `You lost ${bet} credits`}
          </p>
          <Button variant="neon" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Play Again</Button>
        </div>
      )}
    </div>
  );
}
