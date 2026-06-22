import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Ticket, Coins, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Draw {
  id: string;
  draw_date: string;
  status: string;
  pot: number;
  winning_numbers: number[] | null;
  winner_user_ids: string[] | null;
  prize_per_winner: number | null;
  completed_at: string | null;
}
interface Ticket {
  id: string;
  draw_id: string;
  numbers: number[];
  matches: number | null;
  created_at: string;
}

const NUMBERS = Array.from({ length: 49 }, (_, i) => i + 1);

export default function Lottery() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState<Draw | null>(null);
  const [past, setPast] = useState<Draw[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [buying, setBuying] = useState(false);

  const load = async () => {
    const { data: draws } = await supabase
      .from("lottery_draws")
      .select("*")
      .order("draw_date", { ascending: false })
      .limit(20);
    if (draws) {
      setCurrent(draws.find((d: Draw) => d.status === "pending") ?? null);
      setPast(draws.filter((d: Draw) => d.status === "completed"));
    }
    if (user) {
      const { data: tickets } = await supabase
        .from("lottery_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (tickets) setMyTickets(tickets as Ticket[]);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("lottery")
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_draws" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_tickets" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const togglePick = (n: number) => {
    setPicked((p) => p.includes(n) ? p.filter((x) => x !== n) : p.length < 6 ? [...p, n] : p);
  };
  const quickPick = () => {
    const pool = [...NUMBERS];
    const out: number[] = [];
    while (out.length < 6) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    setPicked(out.sort((a, b) => a - b));
  };

  const buy = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (picked.length !== 6) { toast({ title: "Pick 6 numbers", variant: "destructive" }); return; }
    setBuying(true);
    const { error } = await supabase.rpc("buy_lottery_ticket", { _numbers: picked });
    setBuying(false);
    if (error) {
      toast({ title: "Could not buy ticket", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket purchased!", description: "Good luck on Sunday 12:00 UTC" });
    setPicked([]);
    await refreshProfile();
    await load();
  };

  const drawDate = current ? new Date(current.draw_date) : null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-3xl font-bold text-gradient">LOTTERY 6/49</h1>
        </div>

        {/* Current pot */}
        <div className="mb-6 rounded-xl border-2 border-neon-orange bg-gradient-to-br from-neon-orange/10 to-transparent p-6 text-center shadow-[0_0_30px_hsl(30,100%,55%,0.3)]">
          <div className="text-sm text-muted-foreground">Current Jackpot</div>
          <div className="my-2 flex items-center justify-center gap-2 font-display text-5xl text-neon-orange">
            <Coins className="h-10 w-10" /> {current?.pot ?? 5000}
          </div>
          <div className="text-sm text-muted-foreground">
            Draw: {drawDate ? drawDate.toLocaleString() : "Sunday 12:00 UTC"} · Tickets cost 100 credits
          </div>
        </div>

        {/* Pick numbers */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Pick 6 numbers ({picked.length}/6)</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={quickPick}>Quick Pick</Button>
              <Button size="sm" variant="outline" onClick={() => setPicked([])}>Clear</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:grid-cols-10">
            {NUMBERS.map((n) => {
              const active = picked.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  className={`h-10 rounded-md border-2 font-display text-sm transition ${
                    active
                      ? "border-neon-orange bg-neon-orange/20 text-neon-orange"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >{n}</button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Your balance: <span className="text-neon-orange">{profile?.credits ?? 0}</span>
            </div>
            <Button variant="neon" disabled={buying || picked.length !== 6 || !user} onClick={buy}>
              <Ticket className="mr-2 h-4 w-4" />{buying ? "Buying…" : "Buy Ticket (100)"}
            </Button>
          </div>
        </div>

        {/* My tickets */}
        {user && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-lg">Your Tickets</h2>
            {myTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            ) : (
              <ul className="space-y-2">
                {myTickets.map((t) => {
                  const draw = [current, ...past].find((d) => d?.id === t.draw_id);
                  return (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-2">
                      <div className="flex flex-wrap gap-1">
                        {t.numbers.map((n) => {
                          const hit = draw?.winning_numbers?.includes(n);
                          return (
                            <span key={n} className={`flex h-8 w-8 items-center justify-center rounded font-display text-xs ${
                              hit ? "bg-neon-green/30 text-neon-green border border-neon-green" : "bg-muted"
                            }`}>{n}</span>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {draw?.status === "completed"
                          ? `${t.matches ?? 0}/6 match${t.matches === 6 ? " · WINNER 🏆" : ""}`
                          : "Pending"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Past draws */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
            <Trophy className="h-5 w-5 text-neon-orange" /> Past Draws
          </h2>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No draws yet.</p>
          ) : (
            <ul className="space-y-3">
              {past.map((d) => (
                <li key={d.id} className="rounded border border-border p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(d.draw_date).toLocaleString()}</span>
                    <span>Pot: <span className="text-neon-orange">{d.pot}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.winning_numbers?.map((n) => (
                      <span key={n} className="flex h-8 w-8 items-center justify-center rounded bg-neon-orange/20 font-display text-xs text-neon-orange border border-neon-orange">
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {d.winner_user_ids && d.winner_user_ids.length > 0
                      ? `${d.winner_user_ids.length} winner(s) · ${d.prize_per_winner} credits each`
                      : "No winners — pot rolled to base"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
