import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Snake } from "./components/games/Snake";
import { TicTacToe } from "./components/games/TicTacToe";
import { MemoryMatch } from "./components/games/MemoryMatch";
import { Game2048 } from "./components/games/Game2048";
import { Breakout } from "./components/games/Breakout";
import { Minesweeper } from "./components/games/Minesweeper";
import { WhackAMole } from "./components/games/WhackAMole";
import { SimonSays } from "./components/games/SimonSays";
import { Pong } from "./components/games/Pong";
import { FlappyBird } from "./components/games/FlappyBird";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/tic-tac-toe" element={<TicTacToe />} />
          <Route path="/memory" element={<MemoryMatch />} />
          <Route path="/2048" element={<Game2048 />} />
          <Route path="/breakout" element={<Breakout />} />
          <Route path="/minesweeper" element={<Minesweeper />} />
          <Route path="/whack-a-mole" element={<WhackAMole />} />
          <Route path="/simon-says" element={<SimonSays />} />
          <Route path="/pong" element={<Pong />} />
          <Route path="/flappy-bird" element={<FlappyBird />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
