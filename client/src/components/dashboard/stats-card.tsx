import { cn } from "@/lib/utils";

type StatCardProps = {
  title: React.ReactNode;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
};

export function StatsCard({ title, value, icon, accentColor }: StatCardProps) {
  return (
    <div className={cn("stat-card border-l-4", accentColor)}>
      <div className="flex items-start sm:items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{title}</p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight mt-0.5 sm:mt-1">{value}</p>
        </div>
        <div className="text-muted-foreground/60 hidden sm:block shrink-0">{icon}</div>
      </div>
    </div>
  );
}

export default StatsCard;
