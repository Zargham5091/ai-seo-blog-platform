import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  gradient?: string;
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, gradient, className }: StatsCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? "+" : ""}{trend.value}% {trend.label}
              </div>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", gradient ?? "bg-indigo-100 dark:bg-indigo-900/30")}>
            <Icon className={cn("h-6 w-6", gradient ? "text-white" : "text-indigo-600 dark:text-indigo-400")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
