import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface GameCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  color: "cyan" | "magenta" | "green" | "orange" | "purple";
}

const colorClasses = {
  cyan: "border-neon-cyan hover:shadow-[0_0_30px_hsl(180,100%,50%,0.4)] bg-gradient-to-br from-neon-cyan/10 to-transparent",
  magenta: "border-neon-magenta hover:shadow-[0_0_30px_hsl(320,100%,60%,0.4)] bg-gradient-to-br from-neon-magenta/10 to-transparent",
  green: "border-neon-green hover:shadow-[0_0_30px_hsl(150,100%,50%,0.4)] bg-gradient-to-br from-neon-green/10 to-transparent",
  orange: "border-neon-orange hover:shadow-[0_0_30px_hsl(30,100%,55%,0.4)] bg-gradient-to-br from-neon-orange/10 to-transparent",
  purple: "border-neon-purple hover:shadow-[0_0_30px_hsl(280,100%,65%,0.4)] bg-gradient-to-br from-neon-purple/10 to-transparent",
};

const iconColorClasses = {
  cyan: "text-neon-cyan",
  magenta: "text-neon-magenta",
  green: "text-neon-green",
  orange: "text-neon-orange",
  purple: "text-neon-purple",
};

export function GameCard({ title, description, icon, path, color }: GameCardProps) {
  return (
    <Link
      to={path}
      className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${colorClasses[color]} card-gradient`}
    >
      <div className="relative z-10">
        <div className={`mb-4 text-4xl ${iconColorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="mb-2 font-display text-xl font-bold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      
      {/* Decorative corner */}
      <div className={`absolute -right-4 -top-4 h-16 w-16 rotate-45 ${colorClasses[color].includes('cyan') ? 'bg-neon-cyan/20' : colorClasses[color].includes('magenta') ? 'bg-neon-magenta/20' : colorClasses[color].includes('green') ? 'bg-neon-green/20' : colorClasses[color].includes('orange') ? 'bg-neon-orange/20' : 'bg-neon-purple/20'}`} />
    </Link>
  );
}
