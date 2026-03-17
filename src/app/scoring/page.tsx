import { POINT_VALUES, type EventType } from "@/lib/scoring";

const MAIN_CATEGORIES: {
  label: string;
  event: EventType;
  description: string;
}[] = [
  {
    label: "Quickfire Win",
    event: "quickfire_win",
    description: "Wins the Quickfire Challenge",
  },
  {
    label: "Quickfire Top",
    event: "quickfire_top",
    description: "Named among the top in the Quickfire",
  },
  {
    label: "Quickfire Bottom",
    event: "quickfire_bottom",
    description: "Named among the bottom in the Quickfire",
  },
  {
    label: "Elimination Win",
    event: "elimination_win",
    description: "Wins the Elimination Challenge",
  },
  {
    label: "Elimination Top",
    event: "elimination_top",
    description: "Named among the top in the Elimination",
  },
  {
    label: "Elimination Bottom",
    event: "elimination_bottom",
    description: "Named among the bottom in the Elimination",
  },
  {
    label: "Last Chance Kitchen Win",
    event: "lck_win",
    description: "Wins a Last Chance Kitchen bout",
  },
];

const BONUS_EVENTS: {
  label: string;
  event: EventType;
  description: string;
}[] = [
  {
    label: "Makes a Risotto",
    event: "bonus_risotto",
    description: "Chef prepares a risotto dish",
  },
  {
    label: "Cries",
    event: "bonus_cries",
    description: "Chef sheds tears on camera",
  },
  {
    label: "Incomplete Plate",
    event: "bonus_incomplete_plate",
    description:
      "Fails to finish plating or leaves an item off the final dish",
  },
  {
    label: "Forgets an Ingredient",
    event: "bonus_forgot_ingredient",
    description: "Forgets to grab an item while grocery shopping",
  },
  {
    label: "Uses Liquid Nitrogen",
    event: "bonus_liquid_nitrogen",
    description: "Breaks out the liquid nitrogen",
  },
];

function PointBadge({ points }: { points: number }) {
  const color =
    points > 0
      ? "bg-green-100 text-green-800"
      : points < 0
        ? "bg-red-100 text-red-800"
        : "bg-muted text-muted-foreground";
  const label = points > 0 ? `+${points}` : `${points}`;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums ${color}`}
    >
      {label}
    </span>
  );
}

function Section({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-10 rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-6 py-4 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5 sm:px-8">{children}</div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
      {/* Decorative top accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      {/* Header */}
      <div className="mb-14 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Scor
          <span className="text-mustard-dark">ing</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          How points are earned (and lost)
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
      </div>

      {/* Main Scoring Categories */}
      <Section title="Main Scoring" delay={100}>
        <div className="space-y-1">
          {MAIN_CATEGORIES.map((cat) => (
            <div
              key={cat.event}
              className="flex items-center justify-between rounded-lg px-4 py-3 odd:bg-muted/30"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {cat.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.description}
                </p>
              </div>
              <PointBadge points={POINT_VALUES[cat.event]} />
            </div>
          ))}
        </div>
      </Section>

      {/* Status Events */}
      <Section title="Status Events" delay={200}>
        <p className="text-sm text-muted-foreground mb-4">
          These events track chef status but don&apos;t award or deduct points.
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-muted/30">
            <div>
              <span className="text-sm font-medium text-foreground">
                Sent to Last Chance Kitchen
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Loses the Elimination and goes to LCK
              </p>
            </div>
            <PointBadge points={0} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-4 py-3">
            <div>
              <span className="text-sm font-medium text-foreground">
                Eliminated
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Loses in Last Chance Kitchen and is out
              </p>
            </div>
            <PointBadge points={0} />
          </div>
        </div>
      </Section>

      {/* Bonus Point Potpourri */}
      <Section title="Bonus Point Potpourri" delay={300}>
        <p className="text-sm text-muted-foreground mb-4">
          Fun bonus events worth <span className="font-semibold text-foreground">+0.5</span> each.
          These can be earned multiple times per episode.
        </p>
        <div className="space-y-1">
          {BONUS_EVENTS.map((cat) => (
            <div
              key={cat.event}
              className="flex items-center justify-between rounded-lg px-4 py-3 odd:bg-muted/30"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {cat.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.description}
                </p>
              </div>
              <PointBadge points={POINT_VALUES[cat.event]} />
            </div>
          ))}
        </div>
      </Section>

      {/* Footer flourish */}
      <div
        className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 animate-fade-in"
        style={{ animationDelay: "400ms" }}
      >
        <div className="h-px w-8 bg-border" />
        <span className="uppercase tracking-[0.2em]">Bon Appetit</span>
        <div className="h-px w-8 bg-border" />
      </div>
    </main>
  );
}
