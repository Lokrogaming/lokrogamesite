import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const ENEMY_WIDTH = 35;
const ENEMY_HEIGHT = 25;

export const SpaceInvaders = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const gameStateRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
    enemies: [] as { x: number; y: number; alive: boolean }[],
    playerBullets: [] as { x: number; y: number }[],
    enemyBullets: [] as { x: number; y: number }[],
    enemyDirection: 1,
    lastShot: 0,
    lastEnemyShot: 0
  });

  const initGame = useCallback(() => {
    const enemies: { x: number; y: number; alive: boolean }[] = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        enemies.push({
          x: col * (ENEMY_WIDTH + 10) + 30,
          y: row * (ENEMY_HEIGHT + 15) + 40,
          alive: true
        });
      }
    }
    gameStateRef.current.enemies = enemies;
    gameStateRef.current.playerBullets = [];
    gameStateRef.current.enemyBullets = [];
    gameStateRef.current.player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
  }, []);

  useEffect(() => {
    initGame();
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
  }, [initGame]);

  useEffect(() => {
    if (gameOver || won) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ') {
        const now = Date.now();
        if (now - gameStateRef.current.lastShot > 250) {
          gameStateRef.current.playerBullets.push({
            x: gameStateRef.current.player.x + PLAYER_WIDTH / 2,
            y: gameStateRef.current.player.y
          });
          gameStateRef.current.lastShot = now;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      // Move player
      if (keys['ArrowLeft'] && state.player.x > 0) state.player.x -= 5;
      if (keys['ArrowRight'] && state.player.x < CANVAS_WIDTH - PLAYER_WIDTH) state.player.x += 5;

      // Move enemies
      let hitEdge = false;
      state.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += state.enemyDirection * 1.5;
        if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - ENEMY_WIDTH) hitEdge = true;
      });

      if (hitEdge) {
        state.enemyDirection *= -1;
        state.enemies.forEach(enemy => {
          if (enemy.alive) enemy.y += 15;
        });
      }

      // Enemy shooting
      const now = Date.now();
      if (now - state.lastEnemyShot > 1500) {
        const aliveEnemies = state.enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
          const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          state.enemyBullets.push({ x: shooter.x + ENEMY_WIDTH / 2, y: shooter.y + ENEMY_HEIGHT });
          state.lastEnemyShot = now;
        }
      }

      // Move bullets
      state.playerBullets = state.playerBullets.filter(b => {
        b.y -= 8;
        return b.y > 0;
      });

      state.enemyBullets = state.enemyBullets.filter(b => {
        b.y += 4;
        return b.y < CANVAS_HEIGHT;
      });

      // Collision detection - player bullets vs enemies
      state.playerBullets = state.playerBullets.filter(bullet => {
        for (const enemy of state.enemies) {
          if (!enemy.alive) continue;
          if (
            bullet.x > enemy.x &&
            bullet.x < enemy.x + ENEMY_WIDTH &&
            bullet.y > enemy.y &&
            bullet.y < enemy.y + ENEMY_HEIGHT
          ) {
            enemy.alive = false;
            setScore(prev => prev + 100);
            return false;
          }
        }
        return true;
      });

      // Collision detection - enemy bullets vs player
      state.enemyBullets = state.enemyBullets.filter(bullet => {
        if (
          bullet.x > state.player.x &&
          bullet.x < state.player.x + PLAYER_WIDTH &&
          bullet.y > state.player.y &&
          bullet.y < state.player.y + PLAYER_HEIGHT
        ) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) setGameOver(true);
            return newLives;
          });
          return false;
        }
        return true;
      });

      // Check win condition
      if (state.enemies.every(e => !e.alive)) {
        setWon(true);
      }

      // Check lose condition - enemies reached bottom
      if (state.enemies.some(e => e.alive && e.y + ENEMY_HEIGHT >= state.player.y)) {
        setGameOver(true);
      }

      // Draw
      ctx.fillStyle = 'hsl(222, 47%, 6%)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw player
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.beginPath();
      ctx.moveTo(state.player.x + PLAYER_WIDTH / 2, state.player.y);
      ctx.lineTo(state.player.x, state.player.y + PLAYER_HEIGHT);
      ctx.lineTo(state.player.x + PLAYER_WIDTH, state.player.y + PLAYER_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Draw enemies
      state.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        ctx.fillStyle = 'hsl(320, 100%, 60%)';
        ctx.fillRect(enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT);
      });

      // Draw player bullets
      ctx.fillStyle = 'hsl(150, 100%, 50%)';
      state.playerBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
      });

      // Draw enemy bullets
      ctx.fillStyle = 'hsl(0, 100%, 60%)';
      state.enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
      });

      if (!gameOver && !won) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, won]);

  const resetGame = () => {
    initGame();
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold text-gradient">SPACE INVADERS</h1>
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-between mb-4 px-4">
          <span className="font-display text-lg text-primary">Score: {score}</span>
          <span className="font-display text-lg text-neon-magenta">Lives: {lives}</span>
        </div>

        <div className="card-gradient border border-border rounded-lg p-2 flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded"
          />
        </div>

        {(gameOver || won) && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center card-gradient border border-border rounded-lg p-8">
              <h2 className={`font-display text-4xl font-bold mb-4 ${won ? 'text-neon-green' : 'text-destructive'}`}>
                {won ? 'YOU WIN!' : 'GAME OVER'}
              </h2>
              <p className="text-xl text-muted-foreground mb-4">Score: {score}</p>
              <Button onClick={resetGame} className="bg-primary">Play Again</Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Arrow keys to move, Space to shoot
        </p>
      </div>
    </div>
  );
};
