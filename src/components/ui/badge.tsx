import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "neutral" | "info";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground/70",
};

export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_CLASSES[tone])} />}
      {children}
    </span>
  );
}
