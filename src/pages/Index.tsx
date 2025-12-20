import { GameCard } from "@/components/GameCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gamepad2, Grid3X3, Brain, Hash, Bomb, Mouse, Palette, Joystick, Bird, Blocks, Rocket, Spade, User, LogOut, Coins } from "lucide-react";

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
};

const Index = () => {
  const { user, profile, signOut, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent" />
        <div className="absolute inset-0 scanlines opacity-30" />
        
        <div className="container relative py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-wider">
              <span className="text-gradient">ARCADE</span>
              <span className="text-foreground"> ZONE</span>
            </h1>
            
            <div className="flex items-center gap-3">
              {!isLoading && (
                user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                      <Coins className="h-4 w-4 text-neon-orange" />
                      <span className="font-display text-sm text-neon-orange">{profile?.credits ?? 0}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
          
          <p className="max-w-2xl text-muted-foreground">
            Play classic browser games. {user ? `Welcome back, ${profile?.username || 'Player'}!` : 'Login to track progress and earn credits.'}
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Arcade Games */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-neon-cyan" />
            Arcade Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.arcade.map((game) => (
              <GameCard key={game.path} {...game} />
            ))}
          </div>
        </section>

        {/* Puzzle Games */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Brain className="h-6 w-6 text-neon-green" />
            Puzzle Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.puzzle.map((game) => (
              <GameCard key={game.path} {...game} />
            ))}
          </div>
        </section>

        {/* Card & Strategy */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Spade className="h-6 w-6 text-neon-orange" />
            Card & Strategy
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.card.map((game) => (
              <GameCard key={game.path} {...game} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-center">
          <p className="font-body text-sm text-muted-foreground">
            Built with React • 14 Games Available • Works on Mobile & Desktop
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
