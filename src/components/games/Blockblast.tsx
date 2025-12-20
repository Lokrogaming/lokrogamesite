import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const GRID_SIZE = 8;
const COLORS = [
  'hsl(180, 100%, 50%)',   // Cyan
  'hsl(320, 100%, 60%)',   // Magenta
  'hsl(150, 100%, 50%)',   // Green
  'hsl(30, 100%, 55%)',    // Orange
  'hsl(280, 100%, 65%)',   // Purple
  'hsl(45, 100%, 50%)',    // Yellow
];

type Block = {
  color: string;
  id: number;
};

type Piece = {
  blocks: { x: number; y: number }[];
  color: string;
};

const PIECES: { blocks: { x: number; y: number }[] }[] = [
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] }, // L-shape
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] }, // Line-3
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] }, // Square
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] }, // Z-shape
  { blocks: [{ x: 0, y: 0 }] }, // Single
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }, // Line-2
  { blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] }, // T-shape
];

export const Blockblast = () => {
  const [grid, setGrid] = useState<(Block | null)[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [score, setScore] = useState(0);
  const [currentPieces, setCurrentPieces] = useState<Piece[]>(() => generatePieces());
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [blockId, setBlockId] = useState(0);

  function generatePieces(): Piece[] {
    return Array(3).fill(null).map(() => {
      const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return { blocks: piece.blocks.map(b => ({ ...b })), color };
    });
  }

  const canPlacePiece = useCallback((piece: Piece, startX: number, startY: number, currentGrid: (Block | null)[][]): boolean => {
    for (const block of piece.blocks) {
      const x = startX + block.x;
      const y = startY + block.y;
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
      if (currentGrid[y][x] !== null) return false;
    }
    return true;
  }, []);

  const checkAndClearLines = useCallback((currentGrid: (Block | null)[][]): { grid: (Block | null)[][]; cleared: number } => {
    const newGrid = currentGrid.map(row => [...row]);
    let cleared = 0;

    // Check rows
    for (let y = 0; y < GRID_SIZE; y++) {
      if (newGrid[y].every(cell => cell !== null)) {
        newGrid[y] = Array(GRID_SIZE).fill(null);
        cleared++;
      }
    }

    // Check columns
    for (let x = 0; x < GRID_SIZE; x++) {
      if (newGrid.every(row => row[x] !== null)) {
        for (let y = 0; y < GRID_SIZE; y++) {
          newGrid[y][x] = null;
        }
        cleared++;
      }
    }

    return { grid: newGrid, cleared };
  }, []);

  const hasValidMove = useCallback((pieces: Piece[], currentGrid: (Block | null)[][]): boolean => {
    for (const piece of pieces) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlacePiece(piece, x, y, currentGrid)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [canPlacePiece]);

  const handleCellClick = (cellX: number, cellY: number) => {
    if (gameOver || selectedPiece === null) return;

    const piece = currentPieces[selectedPiece];
    if (!piece || !canPlacePiece(piece, cellX, cellY, grid)) return;

    let newGrid = grid.map(row => [...row]);
    let currentId = blockId;

    for (const block of piece.blocks) {
      const x = cellX + block.x;
      const y = cellY + block.y;
      newGrid[y][x] = { color: piece.color, id: currentId++ };
    }

    setBlockId(currentId);

    const { grid: clearedGrid, cleared } = checkAndClearLines(newGrid);
    newGrid = clearedGrid;

    const pointsForPlacement = piece.blocks.length * 10;
    const pointsForClearing = cleared * 100;
    setScore(prev => prev + pointsForPlacement + pointsForClearing);
    setGrid(newGrid);

    const newPieces = [...currentPieces];
    newPieces[selectedPiece] = { blocks: [], color: '' };

    const remainingPieces = newPieces.filter(p => p.blocks.length > 0);
    
    if (remainingPieces.length === 0) {
      const fresh = generatePieces();
      if (!hasValidMove(fresh, newGrid)) {
        setGameOver(true);
      }
      setCurrentPieces(fresh);
    } else {
      if (!hasValidMove(remainingPieces, newGrid)) {
        setGameOver(true);
      }
      setCurrentPieces(newPieces);
    }

    setSelectedPiece(null);
  };

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setCurrentPieces(generatePieces());
    setSelectedPiece(null);
    setGameOver(false);
    setBlockId(0);
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
          <h1 className="font-display text-2xl font-bold text-gradient">BLOCKBLAST</h1>
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <span className="font-display text-xl text-primary">Score: {score}</span>
        </div>

        <div className="card-gradient border border-border rounded-lg p-4 mb-6">
          <div 
            className="grid gap-1 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              maxWidth: '320px'
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <button
                  key={`${y}-${x}`}
                  onClick={() => handleCellClick(x, y)}
                  className="aspect-square rounded-sm border border-border/50 transition-all hover:border-primary/50"
                  style={{
                    backgroundColor: cell?.color || 'hsl(var(--muted))',
                    boxShadow: cell ? `0 0 8px ${cell.color}` : 'none'
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {currentPieces.map((piece, index) => (
            <button
              key={index}
              onClick={() => piece.blocks.length > 0 && setSelectedPiece(index)}
              disabled={piece.blocks.length === 0}
              className={`p-2 rounded-lg border-2 transition-all ${
                selectedPiece === index
                  ? 'border-primary glow-cyan'
                  : 'border-border hover:border-primary/50'
              } ${piece.blocks.length === 0 ? 'opacity-30' : ''}`}
            >
              <div 
                className="grid gap-px"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(...piece.blocks.map(b => b.x)) + 1 || 1}, 1fr)`
                }}
              >
                {piece.blocks.length > 0 && (() => {
                  const maxX = Math.max(...piece.blocks.map(b => b.x));
                  const maxY = Math.max(...piece.blocks.map(b => b.y));
                  const cells = [];
                  for (let y = 0; y <= maxY; y++) {
                    for (let x = 0; x <= maxX; x++) {
                      const hasBlock = piece.blocks.some(b => b.x === x && b.y === y);
                      cells.push(
                        <div
                          key={`${y}-${x}`}
                          className="w-4 h-4 rounded-sm"
                          style={{
                            backgroundColor: hasBlock ? piece.color : 'transparent'
                          }}
                        />
                      );
                    }
                  }
                  return cells;
                })()}
              </div>
            </button>
          ))}
        </div>

        {gameOver && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center card-gradient border border-border rounded-lg p-8">
              <h2 className="font-display text-4xl font-bold text-destructive mb-4">GAME OVER</h2>
              <p className="text-xl text-muted-foreground mb-4">Score: {score}</p>
              <Button onClick={resetGame} className="bg-primary">Play Again</Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Select a piece, then click on the grid to place it. Clear rows and columns to score!
        </p>
      </div>
    </div>
  );
};
