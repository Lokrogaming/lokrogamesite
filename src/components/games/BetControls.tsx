import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';
import { MIN_BET, MAX_BET } from '@/hooks/useBetting';

interface Props {
  bet: number;
  setBet: (n: number) => void;
  credits: number;
  disabled?: boolean;
}

export function BetControls({ bet, setBet, credits, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-neon-orange">
        <Coins className="h-4 w-4" />
        <span className="font-display text-sm">{credits}</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Bet:</label>
        <Input
          type="number"
          min={MIN_BET}
          max={MAX_BET}
          value={bet}
          disabled={disabled}
          onChange={(e) => setBet(Math.max(MIN_BET, Math.min(MAX_BET, parseInt(e.target.value || '0', 10) || 0)))}
          className="h-8 w-24"
        />
        <div className="flex gap-1">
          {[10, 50, 100, 500].map((v) => (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => setBet(Math.min(MAX_BET, v))}
              className="rounded border border-border bg-muted px-2 py-1 text-xs hover:bg-muted/70 disabled:opacity-50"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Min {MIN_BET} · Max {MAX_BET}</span>
    </div>
  );
}
