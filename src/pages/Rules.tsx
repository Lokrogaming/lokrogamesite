import { Navbar } from "@/components/Navbar";
import { AlertTriangle, Sparkles, Shield, Coins } from "lucide-react";

const Rules = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-3xl">
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">Rules</span> & Announcements
          </h1>
          <p className="text-muted-foreground">
            Everything you need to know to play fairly on LokroGames.
          </p>
        </div>

        <section className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600/15 to-emerald-900/5 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-emerald-400" />
            <h2 className="font-display text-xl font-bold">New Games Incoming</h2>
          </div>
          <p className="text-foreground/90">
            We're introducing more games as we approach the official release of LokroGames.
            To make <span className="text-neon-orange font-semibold">Credits</span> more valuable,
            we're adding casino-style games like Pick-A-Card, Roulette, Slots, Coinflip, Blackjack and more.
          </p>
        </section>

        <section className="rounded-2xl border border-destructive/40 bg-gradient-to-br from-destructive/15 to-destructive/5 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="font-display text-xl font-bold">Strictly Prohibited</h2>
          </div>
          <p className="mb-3 text-foreground/90">For legal purposes, the following are forbidden:</p>
          <ul className="space-y-2">
            {[
              "Selling accounts",
              "Buying accounts",
              "Buying currency (credits)",
              "Selling currency (credits)",
              "Cheating with bots, hacks or exploits",
            ].map((rule) => (
              <li key={rule} className="flex items-center gap-2 text-destructive-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <Coins className="h-6 w-6 text-neon-orange mb-2" />
            <h3 className="font-display font-bold mb-2">Earning Credits</h3>
            <p className="text-sm text-muted-foreground">
              Win games, complete daily challenges, or invite friends to earn more credits.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <Shield className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-display font-bold mb-2">Fair Play</h3>
            <p className="text-sm text-muted-foreground">
              Our automod and staff team monitor activity. Breaking rules results in warnings, kicks, timeouts or bans.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Rules;
