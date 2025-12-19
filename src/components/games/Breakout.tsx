import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 35;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 4;

interface Brick {
  x: number;
  y: number;
  active: boolean;
  color: string;
}

export function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  const paddleX = useRef(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT - 40);
  const ballDX = useRef(3);
  const ballDY = useRef(-3);
  const bricks = useRef<Brick[]>([]);
  const animationRef = useRef<number>();

  const colors = ["#00ffff", "#ff00aa", "#00ff88", "#ff8800", "#aa00ff"];

  const initBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    const offsetX = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING))) / 2;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: offsetX + col * (BRICK_WIDTH + BRICK_PADDING),
          y: 40 + row * (BRICK_HEIGHT + BRICK_PADDING),
          active: true,
          color: colors[row % colors.length],
        });
      }
    }
    bricks.current = newBricks;
  }, []);

  const resetGame = () => {
    paddleX.current = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    ballX.current = CANVAS_WIDTH / 2;
    ballY.current = CANVAS_HEIGHT - 40;
    ballDX.current = 3;
    ballDY.current = -3;
    initBricks();
    setScore(0);
    setGameOver(false);
    setWon(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    initBricks();
  }, [initBricks]);

  const movePaddle = (direction: "left" | "right") => {
    const speed = 20;
    if (direction === "left") {
      paddleX.current = Math.max(0, paddleX.current - speed);
    } else {
      paddleX.current = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddleX.current + speed);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === "ArrowLeft") movePaddle("left");
      if (e.key === "ArrowRight") movePaddle("right");
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPlaying) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      paddleX.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = "#0a0f1c";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw bricks
      bricks.current.forEach((brick) => {
        if (brick.active) {
          ctx.fillStyle = brick.color;
          ctx.shadowColor = brick.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
          ctx.shadowBlur = 0;
        }
      });

      // Draw paddle
      ctx.fillStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 15;
      ctx.fillRect(paddleX.current, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.shadowBlur = 0;

      // Draw ball
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ff00aa";
      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;

      // Ball physics
      ballX.current += ballDX.current;
      ballY.current += ballDY.current;

      // Wall collision
      if (ballX.current + BALL_RADIUS > CANVAS_WIDTH || ballX.current - BALL_RADIUS < 0) {
        ballDX.current = -ballDX.current;
      }
      if (ballY.current - BALL_RADIUS < 0) {
        ballDY.current = -ballDY.current;
      }

      // Paddle collision
      if (
        ballY.current + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
        ballX.current > paddleX.current &&
        ballX.current < paddleX.current + PADDLE_WIDTH
      ) {
        ballDY.current = -Math.abs(ballDY.current);
        const hitPos = (ballX.current - paddleX.current) / PADDLE_WIDTH;
        ballDX.current = (hitPos - 0.5) * 6;
      }

      // Brick collision
      bricks.current.forEach((brick) => {
        if (brick.active) {
          if (
            ballX.current > brick.x &&
            ballX.current < brick.x + BRICK_WIDTH &&
            ballY.current > brick.y &&
            ballY.current < brick.y + BRICK_HEIGHT
          ) {
            ballDY.current = -ballDY.current;
            brick.active = false;
            setScore((s) => s + 10);
          }
        }
      });

      // Check win
      if (bricks.current.every((b) => !b.active)) {
        setWon(true);
        setIsPlaying(false);
        return;
      }

      // Check game over
      if (ballY.current + BALL_RADIUS > CANVAS_HEIGHT) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">BREAKOUT</h1>
      </div>

      <div className="font-display text-2xl text-neon-cyan">Score: {score}</div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border-2 border-neon-cyan/50"
        />

        {(!isPlaying || gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <h2 className={`mb-4 font-display text-2xl font-bold ${won ? 'text-neon-green' : gameOver ? 'text-neon-magenta' : 'text-neon-cyan'}`}>
              {won ? "YOU WIN!" : gameOver ? "GAME OVER" : "BREAKOUT"}
            </h2>
            <Button onClick={resetGame} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              {gameOver || won ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-4 md:hidden">
        <Button
          variant="neon"
          size="lg"
          onTouchStart={() => movePaddle("left")}
          onClick={() => movePaddle("left")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onTouchStart={() => movePaddle("right")}
          onClick={() => movePaddle("right")}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Use arrow keys, mouse, or buttons to move paddle
      </p>
    </div>
  );
}
