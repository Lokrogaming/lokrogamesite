import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

type Player = "X" | "O" | null;

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const checkWinner = (squares: Player[]): Player | "draw" | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every((square) => square !== null)) {
      return "draw";
    }

    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
    setWinner(checkWinner(newBoard));
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const getStatus = () => {
    if (winner === "draw") return "It's a Draw!";
    if (winner) return `Winner: ${winner}`;
    return `Next: ${isXNext ? "X" : "O"}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">TIC TAC TOE</h1>
      </div>

      <div className={`font-display text-2xl ${winner ? 'text-neon-green' : 'text-neon-cyan'}`}>
        {getStatus()}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`flex h-20 w-20 items-center justify-center rounded-lg border-2 font-display text-4xl font-bold transition-all duration-200 hover:scale-105 sm:h-24 sm:w-24 ${
              cell === "X"
                ? "border-neon-cyan text-neon-cyan glow-cyan"
                : cell === "O"
                ? "border-neon-magenta text-neon-magenta glow-magenta"
                : "border-border hover:border-primary bg-card"
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <Button onClick={resetGame} variant="neon">
        <RotateCcw className="mr-2 h-4 w-4" />
        New Game
      </Button>
    </div>
  );
}
