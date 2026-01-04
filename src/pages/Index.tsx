import { GameCard } from "@/components/GameCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Gamepad2, Grid3X3, Brain, Hash, Bomb, Mouse, Palette, Joystick, Bird, Blocks, Rocket, Spade, User, LogOut, Coins, Settings, Trophy, Upload, Shield, MessageCircle, Crown, Package } from "lucide-react";
import GlobalChat from "@/components/GlobalChat";
import { Ranklist } from "@/components/Ranklist";

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
  const { user, profile, signOut, isLoading, isStaff, isOwner } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent" />
        <div className="absolute inset-0 scanlines opacity-30" />
        
        <div className="container relative py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-wider">
              <span className="text-gradient">LOKRO</span>
              <span className="text-foreground">GAMES</span>
            </h1>
            
            <div className="flex items-center gap-3">
              {!isLoading && (
                user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                      <Coins className="h-4 w-4 text-neon-orange" />
                      <span className="font-display text-sm text-neon-orange">{profile?.credits ?? 0}</span>
                    </div>
                    <Link to="/settings">
                      <Avatar className="h-9 w-9 border border-primary cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={signOut}>
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

          {/* Quick Actions */}
          {user && (
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/challenges">
                <Button variant="outline" size="sm" className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10">
                  <Trophy className="h-4 w-4 mr-2" />
                  Daily Challenges
                </Button>
              </Link>
              <Link to="/upload-game">
                <Button variant="outline" size="sm" className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit a Game
                </Button>
              </Link>
              <Link to="/inventory">
                <Button variant="outline" size="sm" className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              {isStaff && (
                <Link to="/staff">
                  <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                    <Shield className="h-4 w-4 mr-2" />
                    Staff Panel
                  </Button>
                </Link>
              )}
              {isOwner && (
                <Link to="/owner">
                  <Button variant="outline" size="sm" className="border-gold/50 text-gold hover:bg-gold/10">
                    <Crown className="h-4 w-4 mr-2" />
                    Owner Panel
                  </Button>
                </Link>
              )}
            </div>
          )}
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

        {/* Ranklist */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-neon-orange" />
            XP Ranklist
          </h2>
          <Ranklist />
        </section>

        {/* Global Chat */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-neon-purple" />
            Global Chat
          </h2>
          <GlobalChat />
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-center">
          <p className="font-body text-sm text-muted-foreground">
            Built with React • 14 Games Available • Works on Mobile & Desktop • <a
  href="https://star-dev.xyz/imprint"
  target="_blank"
  rel="noopener noreferrer"
>
  Impressum
</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
