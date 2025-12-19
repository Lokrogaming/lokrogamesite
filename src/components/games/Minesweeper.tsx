import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home, Flag, Bomb } from "lucide-react";
import { Link } from "react-router-dom";

const GRID_SIZE = 8;
const MINE_COUNT = 10;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const [flagMode, setFlagMode] = useState(false);

  const initializeGrid = useCallback((firstClickRow?: number, firstClickCol?: number) => {
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      
      // Don't place mine on first click or if already a mine
      if (!newGrid[row][col].isMine && !(row === firstClickRow && col === firstClickCol)) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[row][col].neighborMines = count;
        }
      }
    }

    return newGrid;
  }, []);

  const revealCell = (grid: Cell[][], row: number, col: number): Cell[][] => {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return grid;
    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return grid;

    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    newGrid[row][col].isRevealed = true;

    if (newGrid[row][col].neighborMines === 0 && !newGrid[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const result = revealCell(newGrid, row + dr, col + dc);
          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              newGrid[i][j] = result[i][j];
            }
          }
        }
      }
    }

    return newGrid;
  };

  const checkWin = (grid: Cell[][]): boolean => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!grid[row][col].isMine && !grid[row][col].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver || won) return;
    if (grid[row]?.[col]?.isRevealed) return;

    if (!started) {
      const newGrid = initializeGrid(row, col);
      const revealedGrid = revealCell(newGrid, row, col);
      setGrid(revealedGrid);
      setStarted(true);
      if (checkWin(revealedGrid)) setWon(true);
      return;
    }

    if (flagMode) {
      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
      setGrid(newGrid);
      return;
    }

    if (grid[row][col].isFlagged) return;

    if (grid[row][col].isMine) {
      const newGrid = grid.map((r) =>
        r.map((c) => ({ ...c, isRevealed: c.isMine ? true : c.isRevealed }))
      );
      setGrid(newGrid);
      setGameOver(true);
      return;
    }

    const newGrid = revealCell(grid, row, col);
    setGrid(newGrid);
    if (checkWin(newGrid)) setWon(true);
  };

  const resetGame = () => {
    setGrid([]);
    setGameOver(false);
    setWon(false);
    setStarted(false);
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return <Flag className="h-4 w-4 text-neon-orange" />;
    if (!cell.isRevealed) return null;
    if (cell.isMine) return <Bomb className="h-4 w-4 text-destructive" />;
    if (cell.neighborMines === 0) return null;
    return cell.neighborMines;
  };

  const getNumberColor = (num: number): string => {
    const colors = ["", "text-neon-cyan", "text-neon-green", "text-neon-orange", "text-neon-purple", "text-neon-magenta", "text-primary", "text-foreground", "text-muted-foreground"];
    return colors[num] || "";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">MINESWEEPER</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={flagMode ? "neonMagenta" : "outline"}
          onClick={() => setFlagMode(!flagMode)}
        >
          <Flag className="mr-2 h-4 w-4" />
          Flag Mode
        </Button>
        <div className="font-display text-lg text-muted-foreground">
          <Bomb className="inline h-4 w-4 mr-1" /> {MINE_COUNT}
        </div>
      </div>

      {(won || gameOver) && (
        <div className={`font-display text-2xl ${won ? 'text-neon-green' : 'text-destructive'}`}>
          {won ? "🎉 You Win!" : "💥 Game Over!"}
        </div>
      )}

      <div className="rounded-lg border-2 border-border bg-card p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {(started ? grid : Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ isRevealed: false, isFlagged: false, isMine: false, neighborMines: 0 }))).flat().map((cell, index) => {
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;
            return (
              <button
                key={index}
                onClick={() => handleCellClick(row, col)}
                className={`flex h-8 w-8 items-center justify-center rounded font-display text-sm font-bold transition-all sm:h-10 sm:w-10 ${
                  cell.isRevealed
                    ? cell.isMine
                      ? "bg-destructive/30 border border-destructive"
                      : "bg-muted border border-border"
                    : "bg-card border-2 border-border hover:border-primary hover:bg-muted"
                } ${getNumberColor(cell.neighborMines)}`}
              >
                {getCellContent(cell)}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={resetGame} variant="neon">
        <RotateCcw className="mr-2 h-4 w-4" />
        New Game
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Click to reveal • Toggle flag mode to mark mines
      </p>
    </div>
  );
}
