import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw, Coins } from 'lucide-react';
import { useBetting, MIN_BET, MAX_BET } from '@/hooks/useBetting';
import { useToast } from '@/hooks/use-toast';

// European single-zero wheel order
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const SLICE = 360 / WHEEL_ORDER.length; // ~9.73°

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const isRed = (n: number) => RED.has(n);
const isBlack = (n: number) => n !== 0 && !RED.has(n);

// Standard payouts (X to 1) — multiplier returned to player includes stake (X+1)x
const PAYOUTS = {
  straight: 35, // single number
  red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
  dozen1: 2, dozen2: 2, dozen3: 2,
  col1: 2, col2: 2, col3: 2,
};

type BetKey = keyof typeof PAYOUTS | `n${number}`;

function evaluateWin(number: number, bets: Record<string, number>) {
  let win = 0;
  const add = (key: string, payoutToOne: number) => {
    const b = bets[key] || 0;
    if (b > 0) win += b * (payoutToOne + 1);
  };
  // straight
  const straight = bets[`n${number}`] || 0;
  if (straight > 0) win += straight * (PAYOUTS.straight + 1);
  if (number !== 0) {
    if (isRed(number)) add('red', PAYOUTS.red);
    if (isBlack(number)) add('black', PAYOUTS.black);
    if (number % 2 === 1) add('odd', PAYOUTS.odd);
    if (number % 2 === 0) add('even', PAYOUTS.even);
    if (number >= 1 && number <= 18) add('low', PAYOUTS.low);
    if (number >= 19 && number <= 36) add('high', PAYOUTS.high);
    if (number <= 12) add('dozen1', PAYOUTS.dozen1);
    else if (number <= 24) add('dozen2', PAYOUTS.dozen2);
    else add('dozen3', PAYOUTS.dozen3);
    const col = ((number - 1) % 3) + 1; // 1,2,3
    if (col === 1) add('col1', PAYOUTS.col1);
    if (col === 2) add('col2', PAYOUTS.col2);
    if (col === 3) add('col3', PAYOUTS.col3);
  }
  return Math.floor(win);
}

// SVG wheel
function Wheel({ rotation, spinDuration, spinning }: { rotation: number; spinDuration: number; spinning: boolean }) {
  const r = 140;
  const cx = 150, cy = 150;
  const segs = useMemo(() => WHEEL_ORDER.map((num, i) => {
    const a0 = (i - 0.5) * SLICE - 90;
    const a1 = (i + 0.5) * SLICE - 90;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
    const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
    const d = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`;
    const fill = num === 0 ? 'hsl(150 80% 35%)' : isRed(num) ? 'hsl(0 75% 45%)' : 'hsl(222 30% 10%)';
    const txtA = i * SLICE - 90;
    const tx = cx + (r - 22) * Math.cos(rad(txtA));
    const ty = cy + (r - 22) * Math.sin(rad(txtA));
    return { d, fill, num, tx, ty, rot: i * SLICE };
  }), []);

  const style = spinning
    ? { ['--spin-end' as any]: `${rotation}deg`, ['--spin-duration' as any]: `${spinDuration}s` }
    : { transform: `rotate(${rotation}deg)` };

  return (
    <div className="relative h-[300px] w-[300px]">
      {/* Pointer */}
      <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
        <div className="h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-neon-orange drop-shadow-[0_0_6px_hsl(var(--neon-orange))]" />
      </div>
      <svg
        viewBox="0 0 300 300"
        className={`h-full w-full drop-shadow-[0_0_25px_hsl(var(--neon-orange)/0.45)] ${spinning ? 'animate-roulette-spin' : ''}`}
        style={style as React.CSSProperties}
        key={spinning ? `s-${rotation}` : `r-${rotation}`}
      >
        <circle cx={cx} cy={cy} r={r + 6} fill="hsl(30 60% 22%)" />
        <circle cx={cx} cy={cy} r={r + 2} fill="hsl(30 80% 35%)" />
        {segs.map((s, i) => (
          <g key={i}>
            <path d={s.d} fill={s.fill} stroke="hsl(45 90% 60%)" strokeWidth={0.6} />
            <text
              x={s.tx}
              y={s.ty}
              fill="white"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${s.rot + 90}, ${s.tx}, ${s.ty})`}
            >
              {s.num}
            </text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={28} fill="hsl(30 80% 35%)" stroke="hsl(45 90% 60%)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={8} fill="hsl(45 90% 70%)" />
      </svg>
    </div>
  );
}

const NUMBER_GRID: number[][] = (() => {
  // 12 columns × 3 rows. Top row = 3,6,9,...; mid = 2,5,...; bottom = 1,4,...
  const rows: number[][] = [[], [], []];
  for (let c = 0; c < 12; c++) {
    rows[0].push(3 + c * 3);
    rows[1].push(2 + c * 3);
    rows[2].push(1 + c * 3);
  }
  return rows;
})();

export function Roulette() {
  const { credits, placeBet, payout, busy, user } = useBetting();
  const { toast } = useToast();
  const [bets, setBets] = useState<Record<string, number>>({});
  const [chip, setChip] = useState<number>(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinDuration, setSpinDuration] = useState(4);
  const rotationRef = useRef(0);

  const totalBet = useMemo(() => Object.values(bets).reduce((a, b) => a + b, 0), [bets]);

  const addBet = (key: string) => {
    if (spinning) return;
    const cur = bets[key] || 0;
    const next = Math.min(MAX_BET, cur + chip);
    setBets((b) => ({ ...b, [key]: next }));
  };

  const clearKey = (key: string) => {
    if (spinning) return;
    setBets((b) => {
      const n = { ...b };
      delete n[key];
      return n;
    });
  };

  const reset = () => {
    setBets({});
    setResult(null);
    setLastWin(null);
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

    const number = Math.floor(Math.random() * 37);
    const idx = WHEEL_ORDER.indexOf(number);
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full turns
    // Wheel rotates so chosen segment lands at top pointer (12 o'clock)
    const target = spins * 360 - idx * SLICE - SLICE / 2 + (Math.random() * SLICE * 0.6 - SLICE * 0.3);
    const newRot = rotationRef.current + target;
    rotationRef.current = newRot;
    setSpinDuration(4.5);
    setRotation(newRot);

    await new Promise((r) => setTimeout(r, 4600));
    setResult(number);
    const win = evaluateWin(number, bets);
    if (win > 0) await payout(win);
    setLastWin(win);
    setSpinning(false);
    toast({
      title: `${number} ${number === 0 ? '🟢 GREEN' : isRed(number) ? '🔴 RED' : '⚫ BLACK'}`,
      description: win > 0 ? `+${win} credits` : `-${totalBet} credits`,
      variant: win > 0 ? 'default' : 'destructive',
    });
  };

  const cellBg = (n: number) =>
    n === 0 ? 'bg-green-700/70 hover:bg-green-700' : isRed(n) ? 'bg-red-700/70 hover:bg-red-700' : 'bg-zinc-900/80 hover:bg-zinc-800';

  const Chip = ({ amount, k }: { amount: number; k: string }) =>
    amount > 0 ? (
      <span
        onClick={(e) => { e.stopPropagation(); clearKey(k); }}
        className="absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 rounded-full border border-neon-orange bg-neon-orange/90 px-1.5 text-[10px] font-bold text-background shadow"
        title="Click to remove"
      >
        {amount}
      </span>
    ) : null;

  const outsideBtn =
    'relative rounded-md border border-border bg-card/70 px-2 py-2 text-xs font-display uppercase hover:bg-card transition';

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 p-4">
      <div className="flex w-full max-w-4xl items-center gap-4">
        <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        <h1 className="font-display text-3xl font-bold text-gradient">ROULETTE</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-neon-orange">
          <Coins className="h-4 w-4" /> <span className="font-display">{credits}</span>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
          Total bet: <span className="text-neon-orange font-display">{totalBet}</span>
        </div>
        {result !== null && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
            Last: <span className={`font-display ${result === 0 ? 'text-green-400' : isRed(result) ? 'text-red-400' : 'text-foreground'}`}>{result}</span>
          </div>
        )}
      </div>

      <Wheel rotation={rotation} spinDuration={spinDuration} spinning={spinning} />

      {/* Chip selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Chip:</span>
        {[5, 10, 25, 50, 100, 500].map((v) => (
          <button
            key={v}
            disabled={spinning}
            onClick={() => setChip(v)}
            className={`h-9 w-9 rounded-full border-2 text-xs font-bold transition ${
              chip === v ? 'border-neon-orange bg-neon-orange/20 text-neon-orange scale-110' : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Betting board */}
      <div className="w-full max-w-3xl overflow-x-auto">
        <div className="flex gap-1 min-w-[640px]">
          {/* Zero */}
          <button
            onClick={() => addBet('n0')}
            className={`relative w-12 ${cellBg(0)} rounded-md border border-border text-white font-display`}
            disabled={spinning}
          >
            0
            <Chip amount={bets['n0'] || 0} k="n0" />
          </button>

          {/* Number grid + column bets */}
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-1">
              {NUMBER_GRID.flat().map((n) => (
                <button
                  key={n}
                  onClick={() => addBet(`n${n}`)}
                  disabled={spinning}
                  className={`relative aspect-square ${cellBg(n)} rounded-md border border-border text-white text-sm font-display`}
                >
                  {n}
                  <Chip amount={bets[`n${n}`] || 0} k={`n${n}`} />
                </button>
              ))}
            </div>
            {/* Dozens */}
            <div className="mt-1 grid grid-cols-3 gap-1">
              {(['dozen1', 'dozen2', 'dozen3'] as const).map((k, i) => (
                <button key={k} onClick={() => addBet(k)} disabled={spinning} className={outsideBtn}>
                  {['1st 12', '2nd 12', '3rd 12'][i]} <span className="text-muted-foreground">2:1</span>
                  <Chip amount={bets[k] || 0} k={k} />
                </button>
              ))}
            </div>
            {/* Even money */}
            <div className="mt-1 grid grid-cols-6 gap-1">
              <button onClick={() => addBet('low')} disabled={spinning} className={outsideBtn}>1-18<Chip amount={bets.low || 0} k="low" /></button>
              <button onClick={() => addBet('even')} disabled={spinning} className={outsideBtn}>Even<Chip amount={bets.even || 0} k="even" /></button>
              <button onClick={() => addBet('red')} disabled={spinning} className={`${outsideBtn} !bg-red-700/60 hover:!bg-red-700`}>Red<Chip amount={bets.red || 0} k="red" /></button>
              <button onClick={() => addBet('black')} disabled={spinning} className={`${outsideBtn} !bg-zinc-900/80 hover:!bg-zinc-800`}>Black<Chip amount={bets.black || 0} k="black" /></button>
              <button onClick={() => addBet('odd')} disabled={spinning} className={outsideBtn}>Odd<Chip amount={bets.odd || 0} k="odd" /></button>
              <button onClick={() => addBet('high')} disabled={spinning} className={outsideBtn}>19-36<Chip amount={bets.high || 0} k="high" /></button>
            </div>
          </div>

          {/* Columns */}
          <div className="flex w-16 flex-col gap-1">
            {(['col3', 'col2', 'col1'] as const).map((k) => (
              <button key={k} onClick={() => addBet(k)} disabled={spinning} className={`${outsideBtn} flex-1`}>
                2:1
                <Chip amount={bets[k] || 0} k={k} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="neon" onClick={spin} disabled={spinning || busy || !user || totalBet === 0}>
          {spinning ? 'Spinning…' : `Spin (${totalBet})`}
        </Button>
        <Button variant="outline" onClick={reset} disabled={spinning}>
          <RotateCcw className="mr-2 h-4 w-4" /> Clear All
        </Button>
      </div>

      {lastWin !== null && !spinning && (
        <p className={`font-display text-xl ${lastWin > 0 ? 'text-neon-green animate-pulse' : 'text-neon-magenta'}`}>
          {lastWin > 0 ? `🎉 Won ${lastWin} credits!` : 'No winning bets'}
        </p>
      )}

      <div className="text-[11px] text-muted-foreground text-center max-w-md">
        Click numbers/outside bets to stack chips. Click a chip to remove it. Payouts: Straight 35:1 · Dozens/Columns 2:1 · Red/Black/Odd/Even/Low/High 1:1.
      </div>
    </div>
  );
}
