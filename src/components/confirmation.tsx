import { Button } from "@/components/ui/button";
import type { Chef } from "@/lib/chefs";

interface ConfirmationProps {
  ownerName: string;
  rankings: Chef[];
  onReset: () => void;
}

export function Confirmation({ ownerName, rankings, onReset }: ConfirmationProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden animate-scale-in">
      {/* Success header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.08] to-transparent px-6 py-8 sm:px-8 text-center">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />

        {/* Checkmark */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mustard/15 border border-mustard/25">
          <svg className="h-7 w-7 text-mustard-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Draft Locked In
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Thanks, <span className="font-semibold text-foreground">{ownerName}</span> — your picks are submitted
        </p>
      </div>

      {/* Rankings recap */}
      <div className="px-6 py-6 sm:px-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Your Rankings
        </h3>
        <div className="space-y-1">
          {rankings.map((chef, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            return (
              <div
                key={chef.id}
                className="flex items-center gap-3 py-1.5 animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isTop3
                      ? "bg-mustard/15 text-mustard-dark border border-mustard/25"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {rank}
                </span>
                <span className={`text-base ${isTop3 ? "font-semibold" : "text-foreground/70"}`}>
                  {chef.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 2L15 8H9L12 2Z" />
            <path d="M6 10H18V12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12V10Z" />
            <path d="M12 18V22" />
            <path d="M8 22H16" />
          </svg>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          Submit Another Draft
        </Button>
      </div>
    </div>
  );
}
