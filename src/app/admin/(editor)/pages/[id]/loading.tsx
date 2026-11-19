export default function PageEditorLoading() {
  return (
    <div className="flex flex-col h-screen h-dvh w-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-pulse">
      {/* Topbar skeleton */}
      <div className="h-14 md:h-16 px-4 border-b border-border/80 bg-background flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-muted/70" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded-md bg-muted/70" />
            <div className="h-3 w-24 rounded-md bg-muted/50" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-muted/60" />
          <div className="h-9 w-24 rounded-xl bg-primary/30" />
        </div>
      </div>

      {/* Split studio skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full lg:w-[500px] border-r border-border/80 bg-background p-5 space-y-4 shrink-0">
          <div className="h-10 w-full rounded-xl bg-primary/20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-2xl border border-border/60 bg-muted/30" />
          ))}
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center p-6">
          <div className="w-[375px] h-[680px] rounded-[46px] border-8 border-slate-800/30 bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
