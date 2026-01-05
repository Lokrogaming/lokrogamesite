import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import UploadGame from "./pages/UploadGame";
import StaffPanel from "./pages/StaffPanel";
import OwnerPanel from "./pages/OwnerPanel";
import Inventory from "./pages/Inventory";
import ApiHome from "./pages/ApiHome";
import ApiDocs from "./pages/ApiDocs";
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
import { Tetris } from "./components/games/Tetris";
import { Blockblast } from "./components/games/Blockblast";
import { SpaceInvaders } from "./components/games/SpaceInvaders";
import { Solitaire } from "./components/games/Solitaire";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/upload-game" element={<UploadGame />} />
            <Route path="/inventory" element={<Inventory />} />
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
            <Route path="/tetris" element={<Tetris />} />
            <Route path="/blockblast" element={<Blockblast />} />
            <Route path="/space-invaders" element={<SpaceInvaders />} />
            <Route path="/solitaire" element={<Solitaire />} />
            <Route path="/staff" element={<StaffPanel />} />
            <Route path="/owner" element={<OwnerPanel />} />
            <Route path="/api" element={<ApiHome />} />
            <Route path="/api/docs" element={<ApiDocs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
