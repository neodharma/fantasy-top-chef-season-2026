import { DraftForm } from "@/components/draft-form";

export default function Home() {
  return (
    <>
      <main className="relative mx-auto max-w-2xl px-5 py-16 sm:py-24">
        {/* Decorative top accent */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

        <div className="mb-14 text-center animate-fade-in">
          <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Ben&apos;s Fantasy
            <br />
            <span className="text-mustard-dark">Top Chef</span>
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Season 2 <span className="text-muted-foreground/60">(well, 23)</span>
          </p>

          {/* Decorative divider */}
          <div className="mx-auto mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-mustard/40" />
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-mustard/50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L15 8H9L12 2Z" />
              <path d="M6 10H18V12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12V10Z" />
              <path d="M12 18V22" />
              <path d="M8 22H16" />
            </svg>
            <div className="h-px w-12 bg-mustard/40" />
          </div>

          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Each team drafts <span className="font-semibold text-foreground">4 chefs</span>. Each chef can be picked by up to <span className="font-semibold text-foreground">3 teams</span>. Points are earned based on how your chefs perform each episode.
          </p>

          <p className="mt-4 text-base font-bold text-foreground max-w-md mx-auto">
            Please submit by March 14th!
          </p>

          <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Enter your team name and your name, then pick chefs in order after watching Episode 1. Click to pick, drag to reorder. If you mess up, just resubmit and text Ben. The draft will be auto-completed next week and teams posted by March 15th.
          </p>

          <div className="mt-6 text-left max-w-md mx-auto space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-mustard-dark/70">What&apos;s new this season</p>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Winning challenges is worth fewer points this season, so there&apos;s less of a gap between the winner and other chefs in the top of the challenge.</li>
              <li>There will be a re-draft after episode 6 or 7 &mdash; Ben will let you know!</li>
            </ul>
          </div>
        </div>

        <div className="animate-scale-in" style={{ animationDelay: "150ms" }}>
          <DraftForm />
        </div>

        {/* Scoring overview */}
        <div className="mt-10 rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-6 py-4 sm:px-8">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              How Scoring Works
            </h2>
          </div>
          <div className="px-6 py-5 sm:px-8 space-y-5">
            <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-base">
              {/* Quickfire */}
              <span className="font-semibold text-foreground col-span-2 mt-1 text-sm uppercase tracking-wider text-mustard-dark/70">Quickfire Challenge</span>
              <span className="text-foreground/80">Win Quickfire</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-right">+1.5</span>
              <span className="text-foreground/80">Top group in Quickfire</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-right">+1</span>
              <span className="text-foreground/80">Bottom group in Quickfire</span>
              <span className="font-bold text-destructive text-right">-1</span>

              {/* Elimination */}
              <span className="font-semibold text-foreground col-span-2 mt-3 text-sm uppercase tracking-wider text-mustard-dark/70">Elimination Challenge</span>
              <span className="text-foreground/80">Win Elimination</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-right">+2</span>
              <span className="text-foreground/80">Top group in Elimination</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-right">+1</span>
              <span className="text-foreground/80">Bottom group in Elimination</span>
              <span className="font-bold text-destructive text-right">-1</span>

              {/* LCK */}
              <span className="font-semibold text-foreground col-span-2 mt-3 text-sm uppercase tracking-wider text-mustard-dark/70">Last Chance Kitchen</span>
              <span className="text-foreground/80">Win LCK weekly</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-right">+1</span>
            </div>
          </div>
        </div>

        {/* Footer flourish */}
        <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="h-px w-8 bg-border" />
          <span className="uppercase tracking-[0.2em]">Bon Appetit</span>
          <div className="h-px w-8 bg-border" />
        </div>
      </main>
    </>
  );
}
