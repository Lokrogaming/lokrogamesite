import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Home, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/contexts/AuthContext";

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;
const GAME_SLUG = "snake";
const WIN_SCORE = 100; // Score needed to "win" and earn double credits

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

export function Snake() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const directionRef = useRef(direction);
  
  const { credits, getGameCost, spendCredits, earnCredits, canAffordGame } = useCredits();
  const { user } = useAuth();
  const gameCost = getGameCost(GAME_SLUG);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = async () => {
    // Require payment to start a new round
    if (user) {
      const paid = await spendCredits(GAME_SLUG);
      if (!paid) return;
      setHasPaid(true);
    }
    
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setIsGameOver(false);
    setScore(0);
    setIsPlaying(true);
    setHasWon(false);
  };

  // Check for win condition
  useEffect(() => {
    if (score >= WIN_SCORE && !hasWon && hasPaid && user) {
      setHasWon(true);
      const winAmount = gameCost * 2;
      earnCredits(winAmount, `Won Snake with ${score} points!`);
    }
  }, [score, hasWon, hasPaid, user, gameCost, earnCredits]);

  const handleDirection = useCallback((newDirection: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    if (opposites[newDirection] !== directionRef.current) {
      setDirection(newDirection);
      directionRef.current = newDirection;
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (e.key) {
        case "ArrowUp":
          handleDirection("UP");
          break;
        case "ArrowDown":
          handleDirection("DOWN");
          break;
        case "ArrowLeft":
          handleDirection("LEFT");
          break;
        case "ArrowRight":
          handleDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, handleDirection]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (directionRef.current) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, food, generateFood]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">SNAKE</h1>
        {user && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            {credits}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="font-display text-2xl text-neon-cyan">
          Score: {score}
        </div>
        {hasWon && (
          <div className="text-sm text-green-400 font-semibold animate-pulse">
            +{gameCost * 2} Won!
          </div>
        )}
      </div>

      <div
        className="relative rounded-lg border-2 border-neon-cyan/50 bg-background/50"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full border-t border-neon-cyan/30"
              style={{ top: i * CELL_SIZE }}
            />
          ))}
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full border-l border-neon-cyan/30"
              style={{ left: i * CELL_SIZE }}
            />
          ))}
        </div>

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm ${index === 0 ? 'bg-neon-green glow-green' : 'bg-neon-cyan'}`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute rounded-full bg-neon-magenta glow-magenta"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
          }}
        />

        {/* Game Over / Start overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <h2 className="mb-2 font-display text-2xl font-bold text-neon-magenta">
              {isGameOver ? (hasWon ? "YOU WON!" : "GAME OVER") : "SNAKE"}
            </h2>
            {isGameOver && hasWon && (
              <p className="mb-2 text-green-400 text-sm">+{gameCost * 2} credits earned!</p>
            )}
            {user && (
              <p className="mb-4 text-xs text-muted-foreground">
                Cost: {gameCost} credits • Win at {WIN_SCORE}+ pts = {gameCost * 2} credits
              </p>
            )}
            <Button 
              onClick={resetGame} 
              variant="neon"
              disabled={user ? !canAffordGame(GAME_SLUG) : false}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isGameOver ? "Play Again" : "Start Game"} {user && `(${gameCost})`}
            </Button>
            {user && !canAffordGame(GAME_SLUG) && (
              <p className="mt-2 text-xs text-destructive">Not enough credits</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <Button
          variant="neon"
          size="icon"
          onTouchStart={() => handleDirection("UP")}
          onClick={() => handleDirection("UP")}
        >
          <ArrowUp />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="neon"
            size="icon"
            onTouchStart={() => handleDirection("LEFT")}
            onClick={() => handleDirection("LEFT")}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="neon"
            size="icon"
            onTouchStart={() => handleDirection("DOWN")}
            onClick={() => handleDirection("DOWN")}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="neon"
            size="icon"
            onTouchStart={() => handleDirection("RIGHT")}
            onClick={() => handleDirection("RIGHT")}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Use arrow keys or buttons to control
      </p>
    </div>
  );
}
