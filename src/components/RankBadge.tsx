import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Star, Gem, Award, Trophy, Sparkles } from 'lucide-react';

type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'queen' | 'king' | 'legend' ;

interface RankBadgeProps {
  rank: UserRank | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const rankConfig: Record<UserRank, { 
  label: string; 
  icon: typeof Medal; 
  className: string;
  iconClassName: string;
}> = {
  bronze: {
    label: 'Bronze',
    icon: Medal,
    className: 'bg-amber-900/20 text-amber-700 border-amber-700/30',
    iconClassName: 'text-amber-700'
  },
  silver: {
    label: 'Silver',
    icon: Medal,
    className: 'bg-slate-300/20 text-slate-400 border-slate-400/30',
    iconClassName: 'text-slate-400'
  },
  gold: {
    label: 'Gold',
    icon: Trophy,
    className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    iconClassName: 'text-yellow-500'
  },
  platinum: {
    label: 'Platinum',
    icon: Gem,
    className: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
    iconClassName: 'text-cyan-400'
  },
  diamond: {
    label: 'Diamond',
    icon: Gem,
    className: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
    iconClassName: 'text-blue-400'
  },
  master: {
    label: 'Master',
    icon: Crown,
    className: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    iconClassName: 'text-purple-500'
  },
  queen: {
    label: 'Queen',
    icon: Crown,
    className: 'bg-pink-500/20 text-amber-500 border-gold/30',
    iconClassName: 'text-purple-500'
  },
  king: {
    label: 'King',
    icon: Crown,
    className: 'bg-gold/20 text-gold border-gold/30',
    iconClassName: 'text-purple-500'
  },
  legend: {
    label: 'Legend',
    icon: Sparkles,
    className: 'bg-gradient-to-r from-amber-500/20 via-red-500/20 to-purple-500/20 text-amber-400 border-amber-400/30',
    iconClassName: 'text-amber-400'
  }
  
};

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-3 py-1.5' }
};

export const RankBadge = ({ rank, showLabel = true, size = 'md' }: RankBadgeProps) => {
  if (!rank) return null;
  
  const config = rankConfig[rank];
  const sizes = sizeConfig[size];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizes.padding} ${sizes.text} gap-1`}
    >
      <Icon className={`${sizes.icon} ${config.iconClassName}`} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
};

export const getRankIcon = (rank: UserRank | null, className?: string) => {
  if (!rank) return null;
  
  const config = rankConfig[rank];
  const Icon = config.icon;
  
  return <Icon className={`${className || 'h-4 w-4'} ${config.iconClassName}`} />;
};
