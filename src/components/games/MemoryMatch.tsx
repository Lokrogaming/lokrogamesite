import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

const EMOJIS = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎵", "🎹"];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initializeGame = () => {
    const shuffledEmojis = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        setCards((prev) =>
          prev.map((card) =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
      setMoves((m) => m + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setIsWon(true);
    }
  }, [cards]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (card?.isFlipped || card?.isMatched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedCards((prev) => [...prev, id]);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold text-gradient">MEMORY MATCH</h1>
      </div>

      <div className="font-display text-xl text-neon-cyan">
        Moves: {moves}
      </div>

      {isWon && (
        <div className="font-display text-2xl text-neon-green animate-pulse-glow">
          🎉 You Won in {moves} moves!
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 text-2xl transition-all duration-300 sm:h-20 sm:w-20 sm:text-3xl ${
              card.isFlipped || card.isMatched
                ? "border-neon-green bg-card rotate-0"
                : "border-border bg-muted hover:border-primary rotate-y-180"
            } ${card.isMatched ? "opacity-60" : ""}`}
            style={{
              transform: card.isFlipped || card.isMatched ? "rotateY(0deg)" : "rotateY(180deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {(card.isFlipped || card.isMatched) && card.emoji}
          </button>
        ))}
      </div>

      <Button onClick={initializeGame} variant="neon">
        <RotateCcw className="mr-2 h-4 w-4" />
        New Game
      </Button>
    </div>
  );
}
