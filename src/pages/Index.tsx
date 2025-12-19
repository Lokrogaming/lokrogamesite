import { GameCard } from "@/components/GameCard";
import { Gamepad2, Grid3X3, Brain, Hash, Bomb, Mouse, Palette, Joystick, Bird } from "lucide-react";

const games = [
  {
    title: "Snake",
    description: "Classic snake game. Eat, grow, survive!",
    icon: <Gamepad2 className="h-10 w-10" />,
    path: "/snake",
    color: "cyan" as const,
  },
  {
    title: "Tic Tac Toe",
    description: "X vs O. Classic two-player strategy.",
    icon: <Grid3X3 className="h-10 w-10" />,
    path: "/tic-tac-toe",
    color: "magenta" as const,
  },
  {
    title: "Memory Match",
    description: "Flip cards and find matching pairs.",
    icon: <Brain className="h-10 w-10" />,
    path: "/memory",
    color: "green" as const,
  },
  {
    title: "2048",
    description: "Slide tiles to reach the 2048 tile.",
    icon: <Hash className="h-10 w-10" />,
    path: "/2048",
    color: "orange" as const,
  },
  {
    title: "Breakout",
    description: "Destroy all bricks with the ball.",
    icon: <Gamepad2 className="h-10 w-10" />,
    path: "/breakout",
    color: "purple" as const,
  },
  {
    title: "Minesweeper",
    description: "Find all mines without triggering them.",
    icon: <Bomb className="h-10 w-10" />,
    path: "/minesweeper",
    color: "cyan" as const,
  },
  {
    title: "Whack a Mole",
    description: "Hit moles as fast as you can!",
    icon: <Mouse className="h-10 w-10" />,
    path: "/whack-a-mole",
    color: "magenta" as const,
  },
  {
    title: "Simon Says",
    description: "Memorize and repeat color sequences.",
    icon: <Palette className="h-10 w-10" />,
    path: "/simon-says",
    color: "green" as const,
  },
  {
    title: "Pong",
    description: "Classic arcade paddle game vs AI.",
    icon: <Joystick className="h-10 w-10" />,
    path: "/pong",
    color: "orange" as const,
  },
  {
    title: "Flappy Bird",
    description: "Tap to fly through the pipes!",
    icon: <Bird className="h-10 w-10" />,
    path: "/flappy-bird",
    color: "purple" as const,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent" />
        <div className="absolute inset-0 scanlines opacity-30" />
        
        <div className="container relative py-16 text-center md:py-24">
          <h1 className="mb-4 font-display text-4xl font-bold tracking-wider md:text-6xl lg:text-7xl">
            <span className="text-gradient">ARCADE</span>
            <span className="text-foreground"> ZONE</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Play classic browser games. No downloads, no accounts. 
            Just pure retro gaming fun.
          </p>
          
          {/* Decorative elements */}
          <div className="absolute left-10 top-10 h-20 w-20 rounded-full bg-neon-cyan/10 blur-3xl" />
          <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-neon-magenta/10 blur-3xl" />
        </div>
      </header>

      {/* Games Grid */}
      <main className="container py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Choose Your Game
          </h2>
          <div className="font-body text-sm text-muted-foreground">
            {games.length} games available
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {games.map((game) => (
            <GameCard
              key={game.path}
              title={game.title}
              description={game.description}
              icon={game.icon}
              path={game.path}
              color={game.color}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center">
          <p className="font-display text-sm text-muted-foreground">
            Built with React • Works on Mobile & Desktop
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
