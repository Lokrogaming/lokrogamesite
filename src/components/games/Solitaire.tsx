import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

type Card = {
  suit: typeof SUITS[number];
  rank: typeof RANKS[number];
  faceUp: boolean;
};

type GameState = {
  deck: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getRankValue = (rank: string): number => {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank);
};

const isRed = (suit: string): boolean => suit === '♥' || suit === '♦';

export const Solitaire = () => {
  const [gameState, setGameState] = useState<GameState>(() => initGame());
  const [selectedCard, setSelectedCard] = useState<{ pile: string; index: number; cardIndex: number } | null>(null);
  const [moves, setMoves] = useState(0);

  function initGame(): GameState {
    const deck = createDeck();
    const tableau: Card[][] = [];
    let cardIndex = 0;

    for (let i = 0; i < 7; i++) {
      tableau[i] = [];
      for (let j = 0; j <= i; j++) {
        const card = deck[cardIndex++];
        card.faceUp = j === i;
        tableau[i].push(card);
      }
    }

    return {
      deck: deck.slice(cardIndex),
      waste: [],
      foundations: [[], [], [], []],
      tableau
    };
  }

  const resetGame = () => {
    setGameState(initGame());
    setSelectedCard(null);
    setMoves(0);
  };

  const drawCard = () => {
    setGameState(prev => {
      if (prev.deck.length === 0) {
        return {
          ...prev,
          deck: prev.waste.map(c => ({ ...c, faceUp: false })).reverse(),
          waste: []
        };
      }
      const card = { ...prev.deck[prev.deck.length - 1], faceUp: true };
      return {
        ...prev,
        deck: prev.deck.slice(0, -1),
        waste: [...prev.waste, card]
      };
    });
    setMoves(m => m + 1);
  };

  const canMoveToFoundation = (card: Card, foundation: Card[]): boolean => {
    if (foundation.length === 0) return card.rank === 'A';
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
  };

  const canMoveToTableau = (card: Card, pile: Card[]): boolean => {
    if (pile.length === 0) return card.rank === 'K';
    const topCard = pile[pile.length - 1];
    if (!topCard.faceUp) return false;
    return isRed(card.suit) !== isRed(topCard.suit) && 
           getRankValue(card.rank) === getRankValue(topCard.rank) - 1;
  };

  const handleCardClick = useCallback((pile: string, pileIndex: number, cardIndex: number) => {
    if (!selectedCard) {
      setSelectedCard({ pile, index: pileIndex, cardIndex });
      return;
    }

    setGameState(prev => {
      const newState = { ...prev };
      let sourceCards: Card[] = [];
      
      if (selectedCard.pile === 'waste') {
        sourceCards = [prev.waste[prev.waste.length - 1]];
        newState.waste = prev.waste.slice(0, -1);
      } else if (selectedCard.pile === 'tableau') {
        sourceCards = prev.tableau[selectedCard.index].slice(selectedCard.cardIndex);
        newState.tableau = prev.tableau.map((p, i) => 
          i === selectedCard.index ? p.slice(0, selectedCard.cardIndex) : [...p]
        );
      }

      if (sourceCards.length === 0) return prev;

      if (pile === 'foundation' && sourceCards.length === 1) {
        if (canMoveToFoundation(sourceCards[0], prev.foundations[pileIndex])) {
          newState.foundations = prev.foundations.map((f, i) =>
            i === pileIndex ? [...f, sourceCards[0]] : [...f]
          );
          
          // Flip card in tableau if needed
          if (selectedCard.pile === 'tableau' && selectedCard.cardIndex > 0) {
            const tableauPile = newState.tableau[selectedCard.index];
            if (tableauPile.length > 0 && !tableauPile[tableauPile.length - 1].faceUp) {
              tableauPile[tableauPile.length - 1].faceUp = true;
            }
          }
          
          setMoves(m => m + 1);
          setSelectedCard(null);
          return newState;
        }
      }

      if (pile === 'tableau') {
        if (canMoveToTableau(sourceCards[0], prev.tableau[pileIndex])) {
          newState.tableau = newState.tableau.map((p, i) =>
            i === pileIndex ? [...p, ...sourceCards] : p
          );
          
          // Flip card if needed
          if (selectedCard.pile === 'tableau' && selectedCard.cardIndex > 0) {
            const tableauPile = newState.tableau[selectedCard.index];
            if (tableauPile.length > 0 && !tableauPile[tableauPile.length - 1].faceUp) {
              tableauPile[tableauPile.length - 1].faceUp = true;
            }
          }
          
          setMoves(m => m + 1);
          setSelectedCard(null);
          return newState;
        }
      }

      return prev;
    });
    
    setSelectedCard(null);
  }, [selectedCard]);

  const renderCard = (card: Card, isSelected: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-12 h-16 sm:w-14 sm:h-20 rounded border-2 flex items-center justify-center font-bold text-sm transition-all ${
        card.faceUp
          ? `bg-card ${isRed(card.suit) ? 'text-destructive' : 'text-foreground'} ${
              isSelected ? 'border-primary glow-cyan' : 'border-border'
            }`
          : 'bg-primary/20 border-primary'
      }`}
    >
      {card.faceUp ? (
        <span>{card.rank}{card.suit}</span>
      ) : (
        <span className="text-primary">♦</span>
      )}
    </button>
  );

  const isWon = gameState.foundations.every(f => f.length === 13);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold text-gradient">SOLITAIRE</h1>
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <span className="font-display text-lg text-primary">Moves: {moves}</span>
        </div>

        {/* Top row: Deck, Waste, Foundations */}
        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={drawCard}
              className="w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-primary bg-primary/10 flex items-center justify-center"
            >
              {gameState.deck.length > 0 ? (
                <span className="text-primary font-bold">{gameState.deck.length}</span>
              ) : (
                <span className="text-primary">↻</span>
              )}
            </button>
            
            <div className="w-12 h-16 sm:w-14 sm:h-20">
              {gameState.waste.length > 0 && renderCard(
                gameState.waste[gameState.waste.length - 1],
                selectedCard?.pile === 'waste',
                () => handleCardClick('waste', 0, gameState.waste.length - 1)
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {gameState.foundations.map((foundation, i) => (
              <button
                key={i}
                onClick={() => handleCardClick('foundation', i, foundation.length)}
                className={`w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-dashed flex items-center justify-center ${
                  foundation.length > 0 ? 'border-primary' : 'border-muted'
                }`}
              >
                {foundation.length > 0 ? (
                  <span className={isRed(foundation[foundation.length - 1].suit) ? 'text-destructive' : 'text-foreground'}>
                    {foundation[foundation.length - 1].rank}{foundation[foundation.length - 1].suit}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">{SUITS[i]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="flex gap-1 justify-center">
          {gameState.tableau.map((pile, pileIndex) => (
            <div key={pileIndex} className="flex flex-col">
              {pile.length === 0 ? (
                <button
                  onClick={() => handleCardClick('tableau', pileIndex, 0)}
                  className="w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-dashed border-muted"
                />
              ) : (
                pile.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    style={{ marginTop: cardIndex > 0 ? '-48px' : 0 }}
                    className="relative"
                  >
                    {renderCard(
                      card,
                      selectedCard?.pile === 'tableau' && 
                      selectedCard?.index === pileIndex && 
                      selectedCard?.cardIndex <= cardIndex,
                      () => card.faceUp && handleCardClick('tableau', pileIndex, cardIndex)
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {isWon && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center card-gradient border border-border rounded-lg p-8">
              <h2 className="font-display text-4xl font-bold text-neon-green mb-4">YOU WIN!</h2>
              <p className="text-xl text-muted-foreground mb-4">Completed in {moves} moves</p>
              <Button onClick={resetGame} className="bg-primary">Play Again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
