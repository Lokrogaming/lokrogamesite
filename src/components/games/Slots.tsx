import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Coins } from 'lucide-react';
import { useBetting } from '@/hooks/useBetting';
import { BetControls } from './BetControls';
import { useToast } from '@/hooks/use-toast';

const SYMBOLS = ['🍒', '🍋', '🔔', '🪙', '💎', '7️⃣'];
const REEL_HEIGHT = 96; // px per symbol cell
const STRIP_REPEATS = 8; // tall strip for spin illusion

function payoutFor(reels: string[]): { mult: number; label: string } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === '7️⃣') return { mult: 10, label: '🎰 JACKPOT 777!' };
    if (a === '🪙') return { mult: 2, label: 'Triple Coin' };
    if (a === '💎') return { mult: 2, label: 'Triple Diamond' };
  }
  return { mult: 0, label: '' };
}

interface ReelProps {
  finalSymbol: string;
  spinning: boolean;
  delay: number; // ms before this reel stops
  trigger: number;
}

function Reel({ finalSymbol, spinning, delay, trigger }: ReelProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Build a strip of repeated symbols for spinning, with final symbol pinned at end
  const strip = useRef<string[]>([]);
  if (strip.current.length === 0) {
    const s: string[] = [];
    for (let i = 0; i < STRIP_REPEATS; i++) {
      for (const sym of SYMBOLS) s.push(sym);
    }
    strip.current = s;
  }

  useEffect(() => {
    if (!spinning) return;
    setAnimating(true);
    // Pin final symbol at a specific index, spin to land there
    const finalIdx = strip.current.length - 1 - SYMBOLS.indexOf(finalSymbol);
    // Make sure landing slot shows the final symbol
    strip.current[finalIdx] = finalSymbol;
    const targetOffset = finalIdx * REEL_HEIGHT;
    // Reset to 0 instantly, then animate to target
    setOffset(0);
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (stripRef.current) {
          stripRef.current.style.transition = `transform ${(1200 + delay) / 1000}s cubic-bezier(0.15, 0.9, 0.2, 1)`;
          stripRef.current.style.transform = `translateY(-${targetOffset}px)`;
        }
      }, 20);
    });
    const t = setTimeout(() => setAnimating(false), 1400 + delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div className="relative h-24 w-20 overflow-hidden rounded-lg border-2 border-border bg-background">
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-background/80 via-transparent to-background/80" />
      <div
        ref={stripRef}
        className="flex flex-col items-center"
        style={{
          transform: `translateY(-${offset}px)`,
          filter: animating ? 'blur(1px)' : 'none',
        }}
      >
        {strip.current.map((sym, i) => (
          <div key={i} className="flex h-24 w-20 shrink-0 items-center justify-center text-5xl">
            {sym}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Slots() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bet, setBet] = useState(20);
  const [reels, setReels] = useState<string[]>(['7️⃣', '💎', '🪙']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winType, setWinType] = useState<'jackpot' | 'win' | null>(null);
  const [trigger, setTrigger] = useState(0);

  const spin = async () => {
    if (!(await placeBet(bet))) return;
    setSpinning(true);
    setLastWin(0);
    setWinType(null);

    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];
    setReels(finalReels);
    setTrigger((t) => t + 1);

    // Wait for last reel to settle (delays 0,200,400ms + 1400ms)
    await new Promise((r) => setTimeout(r, 1900));

    const { mult, label } = payoutFor(finalReels);
    if (mult > 0) {
      const win = bet * mult;
      await payout(win);
      setLastWin(win);
      setWinType(mult >= 10 ? 'jackpot' : 'win');
      toast({ title: label, description: `+${win} credits (×${mult})` });
    } else {
      toast({ title: 'No win', description: `-${bet} credits`, variant: 'destructive' });
    }
    setSpinning(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-6 p-4">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">SLOTS</h1>
      </div>

      <BetControls bet={bet} setBet={setBet} credits={credits} disabled={spinning || busy} />

      <div className="relative">
        <div
          className={`relative flex gap-3 rounded-xl border-2 p-6 transition-all ${
            winType === 'jackpot'
              ? 'border-neon-orange animate-win-flash'
              : winType === 'win'
              ? 'border-neon-green shadow-[0_0_30px_hsl(var(--neon-green)/0.6)]'
              : 'border-neon-orange shadow-[0_0_30px_hsl(30,100%,55%,0.4)]'
          } bg-card`}
        >
          {/* Win line indicator */}
          <div className="pointer-events-none absolute left-2 right-2 top-1/2 z-20 h-0.5 -translate-y-1/2 bg-neon-orange/60 shadow-[0_0_8px_hsl(var(--neon-orange))]" />
          {reels.map((s, i) => (
            <Reel key={i} finalSymbol={s} spinning={spinning} delay={i * 200} trigger={trigger + i * 0.01} />
          ))}
        </div>

        {/* Confetti on jackpot */}
        {winType === 'jackpot' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => {
              const colors = ['#ff8c00', '#00ff88', '#00d4ff', '#ff00aa', '#ffd700'];
              return (
                <span
                  key={i}
                  className="animate-confetti absolute h-2 w-2 rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '0',
                    background: colors[i % colors.length],
                    animationDelay: `${Math.random() * 0.4}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        <div className="font-display text-sm text-foreground mb-1">Paytable</div>
        <div>7️⃣ 7️⃣ 7️⃣ → <span className="text-neon-orange">×10</span></div>
        <div>🪙 🪙 🪙 → <span className="text-neon-green">×2</span></div>
        <div>💎 💎 💎 → <span className="text-neon-cyan">×2</span></div>
      </div>

      <Button variant="neon" onClick={spin} disabled={spinning || busy || !user} className={winType === 'jackpot' ? 'animate-pulse' : ''}>
        <Coins className="mr-2 h-4 w-4" />
        {spinning ? 'Spinning…' : `Spin (${bet})`}
      </Button>

      {lastWin > 0 && !spinning && (
        <p className={`font-display text-2xl ${winType === 'jackpot' ? 'text-neon-orange animate-pulse' : 'text-neon-green'}`}>
          {winType === 'jackpot' ? `🎰 JACKPOT! +${lastWin}` : `Won ${lastWin} credits!`}
        </p>
      )}
    </div>
  );
}
