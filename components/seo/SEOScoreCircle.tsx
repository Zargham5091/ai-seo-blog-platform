"use client";
import { cn } from "@/lib/utils";

interface SEOScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function SEOScoreCircle({ score, size = "md", showLabel = true, className }: SEOScoreCircleProps) {
  const radius = size === "lg" ? 45 : size === "md" ? 35 : 25;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const svgSize = size === "lg" ? 120 : size === "md" ? 90 : 65;

  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor";
  const textSize = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <span className={cn("absolute font-bold", textSize)} style={{ color }}>
          {score}
        </span>
      </div>
      {showLabel && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}
