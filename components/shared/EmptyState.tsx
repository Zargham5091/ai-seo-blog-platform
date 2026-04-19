import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
      {emoji ? (
        <div className="text-5xl mb-4">{emoji}</div>
      ) : Icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      ) : null}

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action && (
            action.href ? (
              <Button asChild variant="gradient">
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button variant="gradient" onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant="outline">
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
