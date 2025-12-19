import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Grid = number[][];

const GRID_SIZE = 4;

const getColor = (value: number): string => {
  const colors: Record<number, string> = {
    2: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan",
    4: "bg-neon-cyan/30 text-neon-cyan border-neon-cyan",
    8: "bg-neon-green/30 text-neon-green border-neon-green",
    16: "bg-neon-green/40 text-neon-green border-neon-green",
    32: "bg-neon-orange/30 text-neon-orange border-neon-orange",
    64: "bg-neon-orange/40 text-neon-orange border-neon-orange",
    128: "bg-neon-magenta/30 text-neon-magenta border-neon-magenta",
    256: "bg-neon-magenta/40 text-neon-magenta border-neon-magenta",
    512: "bg-neon-purple/30 text-neon-purple border-neon-purple",
    1024: "bg-neon-purple/40 text-neon-purple border-neon-purple",
    2048: "bg-gradient-to-br from-neon-cyan to-neon-magenta text-background border-neon-cyan",
  };
  return colors[value] || "bg-muted text-foreground border-border";
};

export function Game2048() {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initializeGrid = useCallback((): Grid => {
    const newGrid: Grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }, []);

  const addRandomTile = (grid: Grid) => {
    const emptyCells: { row: number; col: number }[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 0) emptyCells.push({ row: rowIndex, col: colIndex });
      });
    });

    if (emptyCells.length > 0) {
      const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    resetGame();
  }, [initializeGrid]);

  const canMove = (grid: Grid): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return true;
        if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return true;
        if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return true;
      }
    }
    return false;
  };

  const move = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (gameOver) return;

      let newGrid = grid.map((row) => [...row]);
      let moved = false;
      let newScore = score;

      const slideAndMerge = (line: number[]): number[] => {
        let filtered = line.filter((x) => x !== 0);
        for (let i = 0; i < filtered.length - 1; i++) {
          if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            newScore += filtered[i];
            if (filtered[i] === 2048) setWon(true);
            filtered[i + 1] = 0;
          }
        }
        filtered = filtered.filter((x) => x !== 0);
        while (filtered.length < GRID_SIZE) filtered.push(0);
        return filtered;
      };

      if (direction === "left") {
        for (let i = 0; i < GRID_SIZE; i++) {
          const newRow = slideAndMerge(newGrid[i]);
          if (newRow.join(",") !== newGrid[i].join(",")) moved = true;
          newGrid[i] = newRow;
        }
      } else if (direction === "right") {
        for (let i = 0; i < GRID_SIZE; i++) {
          const newRow = slideAndMerge([...newGrid[i]].reverse()).reverse();
          if (newRow.join(",") !== newGrid[i].join(",")) moved = true;
          newGrid[i] = newRow;
        }
      } else if (direction === "up") {
        for (let j = 0; j < GRID_SIZE; j++) {
          const col = newGrid.map((row) => row[j]);
          const newCol = slideAndMerge(col);
          if (newCol.join(",") !== col.join(",")) moved = true;
          for (let i = 0; i < GRID_SIZE; i++) {
            newGrid[i][j] = newCol[i];
          }
        }
      } else if (direction === "down") {
        for (let j = 0; j < GRID_SIZE; j++) {
          const col = newGrid.map((row) => row[j]).reverse();
          const newCol = slideAndMerge(col).reverse();
          const originalCol = newGrid.map((row) => row[j]);
          if (newCol.join(",") !== originalCol.join(",")) moved = true;
          for (let i = 0; i < GRID_SIZE; i++) {
            newGrid[i][j] = newCol[i];
          }
        }
      }

      if (moved) {
        addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(newScore);
        if (!canMove(newGrid)) {
          setGameOver(true);
        }
      }
    },
    [grid, score, gameOver]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          move("up");
          break;
        case "ArrowDown":
          move("down");
          break;
        case "ArrowLeft":
          move("left");
          break;
        case "ArrowRight":
          move("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">2048</h1>
      </div>

      <div className="font-display text-2xl text-neon-cyan">Score: {score}</div>

      {won && (
        <div className="font-display text-2xl text-neon-green animate-pulse-glow">
          🎉 You reached 2048!
        </div>
      )}

      <div className="relative rounded-lg border-2 border-border bg-card p-2">
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((value, index) => (
            <div
              key={index}
              className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 font-display text-lg font-bold transition-all duration-150 sm:h-20 sm:w-20 sm:text-xl ${getColor(value)}`}
            >
              {value !== 0 && value}
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <h2 className="mb-4 font-display text-2xl font-bold text-neon-magenta">
              GAME OVER
            </h2>
            <Button onClick={resetGame} variant="neon">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <Button variant="neon" size="icon" onClick={() => move("up")}>
          <ArrowUp />
        </Button>
        <div className="flex gap-2">
          <Button variant="neon" size="icon" onClick={() => move("left")}>
            <ArrowLeft />
          </Button>
          <Button variant="neon" size="icon" onClick={() => move("down")}>
            <ArrowDown />
          </Button>
          <Button variant="neon" size="icon" onClick={() => move("right")}>
            <ArrowRight />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Use arrow keys or buttons to slide tiles
      </p>
    </div>
  );
}
