import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Crown, Medal, User } from "lucide-react";

interface Entry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
}

const rankAccent = (i: number) => {
  if (i === 0) return "from-yellow-400/30 to-amber-600/10 border-yellow-400/50";
  if (i === 1) return "from-slate-300/25 to-slate-500/5 border-slate-300/40";
  if (i === 2) return "from-orange-500/25 to-orange-700/5 border-orange-500/40";
  return "from-muted/30 to-transparent border-border";
};

export const CreditLeaderboard = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, credits")
        .order("credits", { ascending: false })
        .limit(10);
      setEntries((data as Entry[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-muted-foreground">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 backdrop-blur p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        {entries.map((e, i) => (
          <Link
            to={`/profiles/${e.user_id}`}
            key={e.user_id}
            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${rankAccent(i)} border hover:scale-[1.01] transition-transform`}
          >
            <div className="flex items-center justify-center w-8 h-8 font-display font-bold text-sm shrink-0">
              {i === 0 ? <Crown className="h-5 w-5 text-yellow-400" /> :
               i === 1 ? <Medal className="h-5 w-5 text-slate-300" /> :
               i === 2 ? <Medal className="h-5 w-5 text-orange-500" /> :
               <span className="text-muted-foreground">#{i + 1}</span>}
            </div>
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={e.avatar_url || ""} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold truncate">
                {e.username || "Anonymous"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-display font-bold text-neon-orange">
              <Coins className="h-4 w-4" />
              {e.credits.toLocaleString()}
            </div>
          </Link>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No players yet.</p>
        )}
      </div>
    </div>
  );
};

export default CreditLeaderboard;
