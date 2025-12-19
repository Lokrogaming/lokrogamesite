import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const WINNING_SCORE = 5;

export function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);

  const playerY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const aiY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT / 2);
  const ballDX = useRef(4);
  const ballDY = useRef(2);
  const animationRef = useRef<number>();

  const resetBall = useCallback((direction: number) => {
    ballX.current = CANVAS_WIDTH / 2;
    ballY.current = CANVAS_HEIGHT / 2;
    ballDX.current = 4 * direction;
    ballDY.current = (Math.random() - 0.5) * 4;
  }, []);

  const startGame = () => {
    setPlayerScore(0);
    setAiScore(0);
    setWinner(null);
    playerY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    aiY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setIsPlaying(true);
  };

  const movePlayer = useCallback((direction: "up" | "down") => {
    const speed = 20;
    if (direction === "up") {
      playerY.current = Math.max(0, playerY.current - speed);
    } else {
      playerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY.current + speed);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === "ArrowUp") movePlayer("up");
      if (e.key === "ArrowDown") movePlayer("down");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, movePlayer]);

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
      // Clear
      ctx.fillStyle = "#0a0f1c";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Player paddle
      ctx.fillStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 15;
      ctx.fillRect(10, playerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // AI paddle
      ctx.fillStyle = "#ff00aa";
      ctx.shadowColor = "#ff00aa";
      ctx.fillRect(CANVAS_WIDTH - 20, aiY.current, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "#00ff88";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // AI movement
      const aiCenter = aiY.current + PADDLE_HEIGHT / 2;
      const aiSpeed = 3;
      if (aiCenter < ballY.current - 20) {
        aiY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiY.current + aiSpeed);
      } else if (aiCenter > ballY.current + 20) {
        aiY.current = Math.max(0, aiY.current - aiSpeed);
      }

      // Ball movement
      ballX.current += ballDX.current;
      ballY.current += ballDY.current;

      // Top/bottom collision
      if (ballY.current - BALL_SIZE / 2 < 0 || ballY.current + BALL_SIZE / 2 > CANVAS_HEIGHT) {
        ballDY.current = -ballDY.current;
      }

      // Player paddle collision
      if (
        ballX.current - BALL_SIZE / 2 < 20 &&
        ballY.current > playerY.current &&
        ballY.current < playerY.current + PADDLE_HEIGHT
      ) {
        ballDX.current = Math.abs(ballDX.current);
        const hitPos = (ballY.current - playerY.current) / PADDLE_HEIGHT - 0.5;
        ballDY.current = hitPos * 6;
      }

      // AI paddle collision
      if (
        ballX.current + BALL_SIZE / 2 > CANVAS_WIDTH - 20 &&
        ballY.current > aiY.current &&
        ballY.current < aiY.current + PADDLE_HEIGHT
      ) {
        ballDX.current = -Math.abs(ballDX.current);
        const hitPos = (ballY.current - aiY.current) / PADDLE_HEIGHT - 0.5;
        ballDY.current = hitPos * 6;
      }

      // Scoring
      if (ballX.current < 0) {
        setAiScore((s) => {
          const newScore = s + 1;
          if (newScore >= WINNING_SCORE) {
            setWinner("ai");
            setIsPlaying(false);
          }
          return newScore;
        });
        resetBall(-1);
      } else if (ballX.current > CANVAS_WIDTH) {
        setPlayerScore((s) => {
          const newScore = s + 1;
          if (newScore >= WINNING_SCORE) {
            setWinner("player");
            setIsPlaying(false);
          }
          return newScore;
        });
        resetBall(1);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, resetBall]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">PONG</h1>
      </div>

      <div className="flex gap-8 font-display text-2xl">
        <span className="text-neon-cyan">{playerScore}</span>
        <span className="text-muted-foreground">-</span>
        <span className="text-neon-magenta">{aiScore}</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border-2 border-border"
        />

        {(!isPlaying || winner) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <h2 className={`mb-4 font-display text-2xl font-bold ${winner === 'player' ? 'text-neon-green' : winner === 'ai' ? 'text-destructive' : 'text-foreground'}`}>
              {winner === "player" ? "You Win!" : winner === "ai" ? "AI Wins!" : "PONG"}
            </h2>
            <Button onClick={startGame} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              {winner ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex flex-col gap-2 md:hidden">
        <Button
          variant="neon"
          size="lg"
          onTouchStart={() => movePlayer("up")}
          onClick={() => movePlayer("up")}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onTouchStart={() => movePlayer("down")}
          onClick={() => movePlayer("down")}
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Use arrow keys or buttons • First to {WINNING_SCORE} wins
      </p>
    </div>
  );
}
