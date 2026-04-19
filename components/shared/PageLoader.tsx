import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PageLoader({ message = "Loading...", className, size = "md" }: PageLoaderProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}>
      <div className="relative">
        <div className={cn("rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center", sizeClasses[size], "p-1.5")}>
          <Layers className="h-full w-full text-white" />
        </div>
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-indigo-600/30 to-sky-500/30 blur animate-pulse" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    </div>
  );
}

export function SkeletonCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 space-y-3", className)}>
      <div className="h-4 skeleton rounded w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 skeleton rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}
