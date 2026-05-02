import { RedraftForm } from "@/components/redraft-form";

export const dynamic = "force-dynamic";

export default function RedraftPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      <div className="mb-10 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Re
          <span className="text-mustard-dark">draft</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Fresh rosters from the surviving chefs
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border/60 bg-card/60 px-6 py-5 text-sm text-muted-foreground space-y-2">
        <p className="text-foreground font-semibold">How the redraft works</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Each team optionally <span className="font-semibold text-foreground">keeps 1 chef</span> from their original roster.</li>
          <li>Then ranks the remaining surviving chefs to fill the rest of their roster.</li>
          <li>Every team ends with <span className="font-semibold text-foreground">3 chefs</span> total (kept + drafted).</li>
          <li>A chef can now be on <span className="font-semibold text-foreground">up to 4 teams</span> (raised from 3).</li>
          <li>Pick order is <span className="font-semibold text-foreground">reverse current standings</span> — last place picks first, snake.</li>
          <li>Points already earned in episodes 1–8 stay on your team. New points from episode 9 onward go to whoever owns the chef post-redraft.</li>
        </ul>
      </div>

      <RedraftForm />
    </main>
  );
}
