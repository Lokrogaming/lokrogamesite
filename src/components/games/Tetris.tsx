import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_SPEED = 500;

type Piece = {
  shape: number[][];
  x: number;
  y: number;
  color: string;
};

const PIECES = [
  { shape: [[1, 1, 1, 1]], color: 'hsl(180, 100%, 50%)' }, // I
  { shape: [[1, 1], [1, 1]], color: 'hsl(45, 100%, 50%)' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'hsl(280, 100%, 60%)' }, // T
  { shape: [[1, 0, 0], [1, 1, 1]], color: 'hsl(30, 100%, 50%)' }, // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: 'hsl(220, 100%, 60%)' }, // J
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'hsl(120, 100%, 45%)' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'hsl(0, 100%, 55%)' }, // Z
];

export const Tetris = () => {
  const [board, setBoard] = useState<(string | null)[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const createPiece = useCallback((): Piece => {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: piece.shape.map(row => [...row]),
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0,
      color: piece.color
    };
  }, []);

  const canMove = useCallback((piece: Piece, board: (string | null)[][], dx: number, dy: number): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
          if (newY >= 0 && board[newY][newX]) return false;
        }
      }
    }
    return true;
  }, []);

  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  const placePiece = useCallback((piece: Piece, board: (string | null)[][]): (string | null)[][] => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: (string | null)[][]): { board: (string | null)[][]; cleared: number } => {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const cleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { board: newBoard, cleared };
  }, []);

  const tick = useCallback(() => {
    if (gameOver || isPaused || !currentPiece) return;

    if (canMove(currentPiece, board, 0, 1)) {
      setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
    } else {
      const newBoard = placePiece(currentPiece, board);
      const { board: clearedBoard, cleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => prev + cleared);
      setScore(prev => prev + cleared * 100 * level);
      setLevel(prev => Math.floor((lines + cleared) / 10) + 1);

      const next = nextPiece || createPiece();
      if (!canMove(next, clearedBoard, 0, 0)) {
        setGameOver(true);
      } else {
        setCurrentPiece(next);
        setNextPiece(createPiece());
      }
    }
  }, [currentPiece, board, gameOver, isPaused, canMove, placePiece, clearLines, nextPiece, createPiece, level, lines]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver || isPaused || !currentPiece) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (canMove(currentPiece, board, -1, 0)) {
          setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
        }
        break;
      case 'ArrowRight':
        if (canMove(currentPiece, board, 1, 0)) {
          setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
        }
        break;
      case 'ArrowDown':
        if (canMove(currentPiece, board, 0, 1)) {
          setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
        }
        break;
      case 'ArrowUp':
        const rotated = rotatePiece(currentPiece);
        if (canMove(rotated, board, 0, 0)) {
          setCurrentPiece(rotated);
        }
        break;
      case ' ':
        let newY = currentPiece.y;
        while (canMove(currentPiece, board, 0, newY - currentPiece.y + 1)) {
          newY++;
        }
        setCurrentPiece({ ...currentPiece, y: newY });
        break;
    }
  }, [currentPiece, board, gameOver, isPaused, canMove, rotatePiece]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createPiece());
      setNextPiece(createPiece());
    }
  }, [currentPiece, gameOver, createPiece]);

  useEffect(() => {
    const interval = setInterval(tick, TICK_SPEED / level);
    return () => clearInterval(interval);
  }, [tick, level]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(null);
    setNextPiece(null);
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.y + y >= 0) {
            displayBoard[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
          }
        }
      }
    }

    return displayBoard;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-bold text-gradient">TETRIS</h1>
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 justify-center">
          <div className="card-gradient border border-border rounded-lg p-2">
            <div 
              className="grid gap-px bg-border"
              style={{ 
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
              }}
            >
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{
                      backgroundColor: cell || 'hsl(var(--background))',
                      boxShadow: cell ? `0 0 8px ${cell}` : 'none'
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card-gradient border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Score</p>
              <p className="font-display text-xl text-primary">{score}</p>
            </div>
            <div className="card-gradient border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Level</p>
              <p className="font-display text-xl text-neon-green">{level}</p>
            </div>
            <div className="card-gradient border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Lines</p>
              <p className="font-display text-xl text-neon-magenta">{lines}</p>
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-4xl font-bold text-destructive mb-4">GAME OVER</h2>
              <p className="text-xl text-muted-foreground mb-4">Score: {score}</p>
              <Button onClick={resetGame} className="bg-primary">Play Again</Button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-2 sm:hidden">
          <Button variant="outline" onClick={() => handleKeyDown({ key: 'ArrowUp' } as KeyboardEvent)}>↻</Button>
          <Button variant="outline" onClick={() => handleKeyDown({ key: 'ArrowDown' } as KeyboardEvent)}>↓</Button>
          <Button variant="outline" onClick={() => handleKeyDown({ key: ' ' } as KeyboardEvent)}>⬇</Button>
          <Button variant="outline" onClick={() => handleKeyDown({ key: 'ArrowLeft' } as KeyboardEvent)}>←</Button>
          <div />
          <Button variant="outline" onClick={() => handleKeyDown({ key: 'ArrowRight' } as KeyboardEvent)}>→</Button>
        </div>
      </div>
    </div>
  );
};
