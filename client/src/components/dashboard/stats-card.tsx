import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
};

export function StatsCard({ title, value, icon, accentColor }: StatCardProps) {
  return (
    <div className={cn("stat-card border-l-4", accentColor)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
        </div>
        <div className="text-muted-foreground/60">{icon}</div>
      </div>
    </div>
  );
}

export default StatsCard;
