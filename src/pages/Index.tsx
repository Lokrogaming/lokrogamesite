import { GameCard } from "@/components/GameCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Gamepad2, Grid3X3, Brain, Hash, Bomb, Mouse, Palette, Joystick, Bird,
  Blocks, Rocket, Spade, Coins, Trophy, MessageCircle, Sparkles, ArrowRight,
} from "lucide-react";
import GlobalChat from "@/components/GlobalChat";
import { Ranklist } from "@/components/Ranklist";
import { Navbar } from "@/components/Navbar";
import { CreditLeaderboard } from "@/components/CreditLeaderboard";

const games = {
  arcade: [
    { title: "Snake", description: "Classic snake game. Eat, grow, survive!", icon: <Gamepad2 className="h-10 w-10" />, path: "/snake", color: "cyan" as const, cost: 5 },
    { title: "Breakout", description: "Destroy all bricks with the ball.", icon: <Gamepad2 className="h-10 w-10" />, path: "/breakout", color: "purple" as const, cost: 5 },
    { title: "Pong", description: "Classic arcade paddle game vs AI.", icon: <Joystick className="h-10 w-10" />, path: "/pong", color: "orange" as const, cost: 5 },
    { title: "Flappy Bird", description: "Tap to fly through the pipes!", icon: <Bird className="h-10 w-10" />, path: "/flappy-bird", color: "purple" as const, cost: 5 },
    { title: "Space Invaders", description: "Defend Earth from alien invasion!", icon: <Rocket className="h-10 w-10" />, path: "/space-invaders", color: "magenta" as const, cost: 8 },
    { title: "Whack a Mole", description: "Hit moles as fast as you can!", icon: <Mouse className="h-10 w-10" />, path: "/whack-a-mole", color: "magenta" as const, cost: 5 },
  ],
  puzzle: [
    { title: "Tetris", description: "Stack blocks, clear lines, score big!", icon: <Blocks className="h-10 w-10" />, path: "/tetris", color: "cyan" as const, cost: 10 },
    { title: "Blockblast", description: "Place blocks to clear rows!", icon: <Grid3X3 className="h-10 w-10" />, path: "/blockblast", color: "green" as const, cost: 10 },
    { title: "2048", description: "Slide tiles to reach the 2048 tile.", icon: <Hash className="h-10 w-10" />, path: "/2048", color: "orange" as const, cost: 5 },
    { title: "Memory Match", description: "Flip cards and find matching pairs.", icon: <Brain className="h-10 w-10" />, path: "/memory", color: "green" as const, cost: 5 },
    { title: "Minesweeper", description: "Find all mines without triggering them.", icon: <Bomb className="h-10 w-10" />, path: "/minesweeper", color: "cyan" as const, cost: 5 },
    { title: "Simon Says", description: "Memorize and repeat color sequences.", icon: <Palette className="h-10 w-10" />, path: "/simon-says", color: "green" as const, cost: 5 },
  ],
  card: [
    { title: "Solitaire", description: "Classic card game of patience.", icon: <Spade className="h-10 w-10" />, path: "/solitaire", color: "orange" as const, cost: 5 },
    { title: "Tic Tac Toe", description: "X vs O. Classic two-player strategy.", icon: <Grid3X3 className="h-10 w-10" />, path: "/tic-tac-toe", color: "magenta" as const, cost: 3 },
  ],
  casino: [
    { title: "Pick-A-Card", description: "5 cards are safe, the other 45 not. 2 lives, bet to win 2x.", icon: <Coins className="h-10 w-10" />, path: "/pickacard", color: "orange" as const, cost: 5 },
    { title: "Roulette", description: "Bet red/black/odd/even. 1.5x per winning field.", icon: <Coins className="h-10 w-10" />, path: "/roulette", color: "magenta" as const, cost: 5 },
    { title: "Slots", description: "Spin to win! 777 pays 10x, triple coin/diamond 2x.", icon: <Coins className="h-10 w-10" />, path: "/slots", color: "cyan" as const, cost: 5 },
    { title: "Coinflip", description: "Heads or tails — double or nothing.", icon: <Coins className="h-10 w-10" />, path: "/coinflip", color: "green" as const, cost: 5 },
    { title: "Lottery 6/49", description: "Pick 6 numbers. Sunday 12:00 UTC draw — winner takes the pot!", icon: <Trophy className="h-10 w-10" />, path: "/lottery", color: "purple" as const, cost: 100 },
  ],
};

const totalGames =
  games.arcade.length + games.puzzle.length + games.card.length + games.casino.length;

const Section = ({
  title, icon, accent, items,
}: { title: string; icon: React.ReactNode; accent: string; items: typeof games.arcade | typeof games.puzzle | typeof games.card | typeof games.casino }) => (
  <section className="mb-14">
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-display text-2xl font-bold flex items-center gap-3">
        <span className={`p-2 rounded-lg bg-gradient-to-br ${accent}`}>{icon}</span>
        {title}
      </h2>
      <span className="text-sm text-muted-foreground">{items.length} games</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((g) => <GameCard key={g.path} {...g} />)}
    </div>
  </section>
);

const Index = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--neon-cyan)/0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--neon-magenta)/0.15),transparent_55%)]" />
        <div className="absolute inset-0 scanlines opacity-20" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs font-medium text-primary mb-6 animate-fade-in">
              <Sparkles className="h-3 w-3" />
              {totalGames} games · Daily challenges · Casino · Lottery
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              Play. Win.
              <br />
              <span className="text-gradient">Climb the ranks.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              {user
                ? `Welcome back, ${profile?.username || "Player"} — your credits are waiting to be doubled.`
                : "Free browser games, real credits, real leaderboards. Sign in to start earning."}
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="#games">
                <Button size="lg" className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-background font-bold hover:opacity-90">
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Browse Games
                </Button>
              </a>
              {!user ? (
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/challenges">
                  <Button size="lg" variant="outline" className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10">
                    <Trophy className="h-5 w-5 mr-2" />
                    Daily Challenges
                  </Button>
                </Link>
              )}
              <Link to="/rules">
                <Button size="lg" variant="ghost">Rules</Button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl">
              {[
                { label: "Games", value: totalGames },
                { label: "Your Credits", value: profile?.credits ?? "—" },
                { label: "Your Rank", value: profile?.username ? "View" : "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main id="games" className="container py-12">
        <Section title="Arcade" icon={<Gamepad2 className="h-5 w-5 text-neon-cyan" />} accent="from-neon-cyan/20 to-neon-cyan/0" items={games.arcade} />
        <Section title="Puzzle" icon={<Brain className="h-5 w-5 text-neon-green" />} accent="from-neon-green/20 to-neon-green/0" items={games.puzzle} />
        <Section title="Card & Strategy" icon={<Spade className="h-5 w-5 text-neon-orange" />} accent="from-neon-orange/20 to-neon-orange/0" items={games.card} />
        <Section title="Casino" icon={<Coins className="h-5 w-5 text-neon-magenta" />} accent="from-neon-magenta/20 to-neon-magenta/0" items={games.casino} />

        {/* Leaderboards row */}
        <section className="grid gap-6 lg:grid-cols-2 mb-14">
          <div>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="p-2 rounded-lg bg-gradient-to-br from-neon-orange/20 to-transparent">
                <Coins className="h-5 w-5 text-neon-orange" />
              </span>
              Credit Leaderboard
            </h2>
            <CreditLeaderboard />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="p-2 rounded-lg bg-gradient-to-br from-neon-purple/20 to-transparent">
                <Trophy className="h-5 w-5 text-neon-purple" />
              </span>
              XP Ranklist
            </h2>
            <Ranklist />
          </div>
        </section>

        {/* Global Chat */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-transparent">
              <MessageCircle className="h-5 w-5 text-neon-cyan" />
            </span>
            Global Chat
          </h2>
          <GlobalChat />
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Built with React · {totalGames} games · Works on Mobile & Desktop</p>
          <p className="mt-2">
            <Link to="/rules" className="hover:text-foreground underline-offset-4 hover:underline">Rules</Link>
            <span className="mx-2">·</span>
            <Link to="/api" className="hover:text-foreground underline-offset-4 hover:underline">API</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
