import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_SPEED = 3;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const animationRef = useRef<number>();
  const frameCount = useRef(0);

  const resetGame = () => {
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const jump = useCallback(() => {
    if (!isPlaying && !gameOver) {
      resetGame();
      return;
    }
    if (isPlaying) {
      birdVelocity.current = JUMP_FORCE;
    }
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

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
      frameCount.current++;

      // Clear
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, "#0a1628");
      gradient.addColorStop(1, "#0d2137");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < 50; i++) {
        const x = (i * 47) % CANVAS_WIDTH;
        const y = (i * 73) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
      }

      // Add new pipe
      if (frameCount.current % 100 === 0) {
        const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
        pipes.current.push({ x: CANVAS_WIDTH, topHeight, passed: false });
      }

      // Update and draw pipes
      pipes.current = pipes.current.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

      pipes.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // Draw top pipe
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        pipeGradient.addColorStop(0, "#00cc88");
        pipeGradient.addColorStop(0.5, "#00ff88");
        pipeGradient.addColorStop(1, "#00cc88");
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);

        // Draw bottom pipe
        const bottomY = pipe.topHeight + PIPE_GAP;
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
        ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 20);

        // Glow effect
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
        ctx.shadowBlur = 0;

        // Score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < CANVAS_WIDTH / 2 - BIRD_SIZE / 2) {
          pipe.passed = true;
          setScore((s) => s + 1);
        }

        // Collision detection
        const birdLeft = CANVAS_WIDTH / 2 - BIRD_SIZE / 2;
        const birdRight = birdLeft + BIRD_SIZE;
        const birdTop = birdY.current - BIRD_SIZE / 2;
        const birdBottom = birdTop + BIRD_SIZE;

        if (
          birdRight > pipe.x &&
          birdLeft < pipe.x + PIPE_WIDTH &&
          (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP)
        ) {
          setGameOver(true);
          setIsPlaying(false);
          setHighScore((prev) => Math.max(prev, score));
        }
      });

      // Update bird
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Ground/ceiling collision
      if (birdY.current + BIRD_SIZE / 2 > CANVAS_HEIGHT || birdY.current - BIRD_SIZE / 2 < 0) {
        setGameOver(true);
        setIsPlaying(false);
        setHighScore((prev) => Math.max(prev, score));
      }

      // Draw bird
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, birdY.current);
      ctx.rotate(Math.min(Math.max(birdVelocity.current * 0.05, -0.5), 0.5));

      // Bird body
      ctx.fillStyle = "#ffcc00";
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = "#ff8800";
      ctx.beginPath();
      ctx.ellipse(-5, 2, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(6, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(18, 2);
      ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, score]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">FLAPPY BIRD</h1>
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

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={jump}
          onTouchStart={jump}
          className="cursor-pointer rounded-lg border-2 border-neon-green/50"
        />

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <h2 className={`mb-4 font-display text-2xl font-bold ${gameOver ? 'text-neon-orange' : 'text-foreground'}`}>
              {gameOver ? "Game Over!" : "FLAPPY BIRD"}
            </h2>
            {gameOver && (
              <p className="mb-4 font-display text-lg text-neon-cyan">
                Score: {score}
              </p>
            )}
            <Button onClick={resetGame} variant="neonGreen">
              <RotateCcw className="mr-2 h-4 w-4" />
              {gameOver ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tap, click, or press Space to fly!
      </p>
    </div>
  );
}
