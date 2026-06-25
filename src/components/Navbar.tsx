import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Gamepad2, Coins, User, LogOut, Trophy, MessageCircle,
  Crown, Shield, Package, Upload, Settings, BookOpen, Menu, X, Ticket
} from "lucide-react";

const navItems = [
  { to: "/", label: "Games", icon: Gamepad2 },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/lottery", label: "Lottery", icon: Ticket },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" },
  { to: "/upload-game", label: "Submit", icon: Upload },
  { to: "/rules", label: "Rules", icon: BookOpen },
];

export const Navbar = () => {
  const { user, profile, signOut, isLoading, isStaff, isOwner } = useAuth();
  const { totalUnread } = useUnreadMessages();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex items-center justify-between h-16 gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5)]">
            <Gamepad2 className="h-5 w-5 text-background" />
          </div>
          <span className="font-display text-xl font-bold tracking-wider hidden sm:inline">
            <span className="text-gradient">LOKRO</span>
            <span className="text-foreground">GAMES</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.badgeKey === "messages" && totalUnread > 0;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
                <Icon className="h-4 w-4" />
                {item.label}
                {showBadge && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLoading && user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-orange/15 to-neon-orange/5 border border-neon-orange/30">
                <Coins className="h-4 w-4 text-neon-orange" />
                <span className="font-display text-sm font-bold text-neon-orange">
                  {profile?.credits ?? 0}
                </span>
              </div>
              {isOwner && (
                <Link to="/owner" className="hidden md:inline-flex">
                  <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10">
                    <Crown className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {isStaff && (
                <Link to="/staff" className="hidden md:inline-flex">
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/settings">
                <Avatar className="h-9 w-9 ring-2 ring-primary/40 hover:ring-primary transition-all">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || "User"} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : !isLoading ? (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-background font-bold hover:opacity-90">
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            {user && (
              <>
                <NavLink to="/settings" onClick={() => setOpen(false)} className={linkClass}>
                  <Settings className="h-4 w-4" /> Settings
                </NavLink>
                {isStaff && (
                  <NavLink to="/staff" onClick={() => setOpen(false)} className={linkClass}>
                    <Shield className="h-4 w-4" /> Staff Panel
                  </NavLink>
                )}
                {isOwner && (
                  <NavLink to="/owner" onClick={() => setOpen(false)} className={linkClass}>
                    <Crown className="h-4 w-4" /> Owner Panel
                  </NavLink>
                )}
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
