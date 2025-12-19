import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

const GRID_SIZE = 9;
const GAME_DURATION = 30;

export function WhackAMole() {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const moleTimer = useRef<NodeJS.Timeout>();
  const gameTimer = useRef<NodeJS.Timeout>();

  const showRandomMole = useCallback(() => {
    const randomHole = Math.floor(Math.random() * GRID_SIZE);
    setActiveMole(randomHole);
    
    const hideDelay = Math.random() * 800 + 400;
    setTimeout(() => {
      setActiveMole((current) => (current === randomHole ? null : current));
    }, hideDelay);
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setActiveMole(null);
  };

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setActiveMole(null);
    if (moleTimer.current) clearTimeout(moleTimer.current);
    if (gameTimer.current) clearInterval(gameTimer.current);
    setHighScore((prev) => Math.max(prev, score));
  }, [score]);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnMole = () => {
      showRandomMole();
      const nextSpawn = Math.random() * 800 + 600;
      moleTimer.current = setTimeout(spawnMole, nextSpawn);
    };

    spawnMole();

    gameTimer.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (moleTimer.current) clearTimeout(moleTimer.current);
      if (gameTimer.current) clearInterval(gameTimer.current);
    };
  }, [isPlaying, showRandomMole, endGame]);

  const whackMole = (index: number) => {
    if (!isPlaying) return;
    if (index === activeMole) {
      setScore((s) => s + 10);
      setActiveMole(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">WHACK A MOLE</h1>
      </div>

      <div className="flex gap-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="font-display text-2xl text-neon-cyan">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Time</div>
          <div className={`font-display text-2xl ${timeLeft <= 10 ? 'text-destructive' : 'text-neon-green'}`}>
            {timeLeft}s
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Best</div>
          <div className="font-display text-2xl text-neon-orange">{highScore}</div>
        </div>
      </div>

      <div className="relative rounded-xl border-2 border-border bg-card p-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: GRID_SIZE }).map((_, index) => (
            <button
              key={index}
              onClick={() => whackMole(index)}
              className={`relative h-20 w-20 overflow-hidden rounded-full border-4 transition-all duration-100 sm:h-24 sm:w-24 ${
                activeMole === index
                  ? "border-neon-green bg-neon-green/20 scale-110"
                  : "border-border bg-muted hover:border-primary"
              }`}
            >
              {/* Hole */}
              <div className="absolute bottom-0 left-1/2 h-8 w-16 -translate-x-1/2 rounded-t-full bg-background/50" />
              
              {/* Mole */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 transition-all duration-150 ${
                  activeMole === index ? "bottom-2" : "-bottom-12"
                }`}
              >
                <div className="text-4xl">🐹</div>
              </div>
            </button>
          ))}
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
            <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
              {timeLeft === 0 ? "Time's Up!" : "WHACK A MOLE"}
            </h2>
            {timeLeft === 0 && (
              <p className="mb-4 font-display text-xl text-neon-cyan">
                Final Score: {score}
              </p>
            )}
            <Button onClick={startGame} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              {timeLeft === 0 ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tap the moles as fast as you can!
      </p>
    </div>
  );
}
