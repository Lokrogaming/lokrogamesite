import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

const COLORS = ["green", "red", "yellow", "blue"] as const;
type Color = typeof COLORS[number];

const colorStyles: Record<Color, { base: string; active: string }> = {
  green: {
    base: "bg-neon-green/30 border-neon-green hover:bg-neon-green/40",
    active: "bg-neon-green glow-green scale-105",
  },
  red: {
    base: "bg-destructive/30 border-destructive hover:bg-destructive/40",
    active: "bg-destructive shadow-[0_0_30px_hsl(0,84%,60%,0.5)] scale-105",
  },
  yellow: {
    base: "bg-neon-orange/30 border-neon-orange hover:bg-neon-orange/40",
    active: "bg-neon-orange shadow-[0_0_30px_hsl(30,100%,55%,0.5)] scale-105",
  },
  blue: {
    base: "bg-neon-cyan/30 border-neon-cyan hover:bg-neon-cyan/40",
    active: "bg-neon-cyan glow-cyan scale-105",
  },
};

export function SimonSays() {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const playSequence = useCallback(async (seq: Color[]) => {
    setIsShowingSequence(true);
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise((resolve) => {
        timeoutRef.current = setTimeout(() => {
          setActiveColor(seq[i]);
          setTimeout(() => {
            setActiveColor(null);
            resolve(null);
          }, 400);
        }, 600);
      });
    }
    
    setIsShowingSequence(false);
  }, []);

  const addToSequence = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    setPlayerSequence([]);
    playSequence(newSequence);
  }, [sequence, playSequence]);

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
    
    setTimeout(() => {
      const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      setSequence([firstColor]);
      playSequence([firstColor]);
    }, 500);
  };

  const handleColorClick = (color: Color) => {
    if (!isPlaying || isShowingSequence || gameOver) return;

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    const currentIndex = newPlayerSequence.length - 1;
    
    if (color !== sequence[currentIndex]) {
      setGameOver(true);
      setIsPlaying(false);
      setHighScore((prev) => Math.max(prev, score));
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setScore((s) => s + 1);
      setTimeout(addToSequence, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">SIMON SAYS</h1>
      </div>

      <div className="flex gap-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="font-display text-2xl text-neon-cyan">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Best</div>
          <div className="font-display text-2xl text-neon-orange">{highScore}</div>
        </div>
      </div>

      {isShowingSequence && (
        <div className="font-display text-lg text-neon-magenta animate-pulse">
          Watch carefully...
        </div>
      )}

      {!isShowingSequence && isPlaying && !gameOver && (
        <div className="font-display text-lg text-neon-green">
          Your turn! ({playerSequence.length}/{sequence.length})
        </div>
      )}

      <div className="relative">
        <div className="grid grid-cols-2 gap-3 rounded-full border-4 border-border bg-card p-4">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              disabled={!isPlaying || isShowingSequence || gameOver}
              className={`h-24 w-24 rounded-full border-4 transition-all duration-150 sm:h-32 sm:w-32 ${
                activeColor === color
                  ? colorStyles[color].active
                  : colorStyles[color].base
              } ${!isPlaying || isShowingSequence ? "cursor-not-allowed" : "cursor-pointer"}`}
            />
          ))}
        </div>

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <h2 className={`mb-2 font-display text-2xl font-bold ${gameOver ? 'text-destructive' : 'text-foreground'}`}>
              {gameOver ? "Wrong!" : "SIMON SAYS"}
            </h2>
            {gameOver && (
              <p className="mb-4 font-display text-lg text-muted-foreground">
                Score: {score}
              </p>
            )}
            <Button onClick={startGame} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              {gameOver ? "Try Again" : "Start"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Repeat the color sequence!
      </p>
    </div>
  );
}
