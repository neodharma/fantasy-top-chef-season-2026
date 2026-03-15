import draftResults from "./draft-results.json";
import distributionChart from "./draft-distribution.png";
import fairnessScatter from "./draft-fairness-scatter.png";

interface Pick {
  round_num: number;
  pick_num: number;
  team_name: string;
  chef_id: string;
  chef_name: string;
  rank_on_list: number;
}

interface Roster {
  teamName: string;
  ownerName: string;
  picks: Pick[];
  avgRank: number;
}

interface ChefPopularity {
  chefId: string;
  chefName: string;
  count: number;
}

interface ChefAvgRank {
  chefId: string;
  chefName: string;
  avgRank: number;
  numTeams: number;
}

const data = draftResults as {
  draftOrder: { teamName: string; ownerName: string }[];
  picks: Pick[];
  rosters: Roster[];
  chefAvgRank: ChefAvgRank[];
  chefPopularity: ChefPopularity[];
  undrafted: { id: string; name: string }[];
  numTeams: number;
};

function RankBadge({ rank }: { rank: number }) {
  const bg =
    rank <= 2
      ? "bg-green-100 text-green-800"
      : rank <= 5
        ? "bg-mustard-light/40 text-mustard-dark"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${bg}`}
    >
      #{rank}
    </span>
  );
}

function PopularityBar({ count, max }: { count: number; max: number }) {
  const pct = (count / max) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-mustard"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ResultsPage() {
  const maxPop = Math.max(...data.chefPopularity.map((c) => c.count));

  return (
    <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
      {/* Decorative top accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      {/* Header */}
      <div className="mb-14 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Draft
          <br />
          <span className="text-mustard-dark">Results</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Season 2{" "}
          <span className="text-muted-foreground/60">(well, 23)</span>
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

        <p className="mt-5 text-base text-muted-foreground max-w-md mx-auto">
          {data.numTeams} teams competed in a {data.rosters[0]?.picks.length}
          -round snake draft for 15 chefs.
        </p>
      </div>

      {/* Team Rosters */}
      <Section title="Team Rosters" delay={100}>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.rosters.map((roster) => (
            <div
              key={roster.teamName}
              className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden"
            >
              <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-5 py-3">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
                <h3 className="font-display text-base font-bold text-foreground truncate">
                  {roster.teamName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {roster.ownerName} &middot; avg rank{" "}
                  <span className="font-semibold text-foreground">
                    {roster.avgRank}
                  </span>
                </p>
              </div>
              <ul className="divide-y divide-border/40 px-5">
                {roster.picks.map((pick) => (
                  <li
                    key={pick.chef_id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        R{pick.round_num}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {pick.chef_name}
                      </span>
                    </div>
                    <RankBadge rank={pick.rank_on_list} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Draft Order */}
      <Section title="Draft Order" delay={200}>
        <ol className="space-y-1">
          {data.draftOrder.map((team, i) => (
            <li key={i} className="flex items-center gap-3 py-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mustard/15 text-sm font-bold text-mustard-dark">
                {i + 1}
              </span>
              <span className="font-semibold text-foreground">
                {team.teamName}
              </span>
              <span className="text-muted-foreground text-sm">
                {team.ownerName}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Draft Log */}
      <Section title="Pick-by-Pick" delay={300}>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((round) => {
            const roundPicks = data.picks.filter(
              (p) => p.round_num === round
            );
            return (
              <div key={round}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-mustard-dark/70 mb-2">
                  Round {round}
                  {round % 2 === 0 ? " (reversed)" : ""}
                </h3>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border/40">
                      {roundPicks.map((pick, i) => (
                        <tr
                          key={pick.pick_num}
                          className={
                            i % 2 === 0 ? "bg-card" : "bg-muted/30"
                          }
                        >
                          <td className="py-2 pl-4 pr-2 w-10 text-muted-foreground font-mono text-xs">
                            {round}.{(i + 1)}
                          </td>
                          <td className="py-2 px-2 font-medium text-foreground">
                            {pick.team_name}
                          </td>
                          <td className="py-2 px-2 text-foreground/80">
                            {pick.chef_name}
                          </td>
                          <td className="py-2 pl-2 pr-4 text-right">
                            <RankBadge rank={pick.rank_on_list} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Most Sought-After */}
      <Section title="Most Sought-After Chefs" delay={400}>
        <p className="text-sm text-muted-foreground mb-4">
          Average rank across all {data.numTeams} teams&rsquo; submissions (lower
          = more wanted).
        </p>
        <div className="space-y-2">
          {data.chefAvgRank.map((chef, i) => {
            const best = data.chefAvgRank[0].avgRank;
            const worst = data.chefAvgRank[data.chefAvgRank.length - 1].avgRank;
            const pct =
              worst === best
                ? 100
                : ((worst - chef.avgRank) / (worst - best)) * 100;
            return (
              <div key={chef.chefId} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mustard/15 text-xs font-bold text-mustard-dark">
                  {i + 1}
                </span>
                <span className="w-44 shrink-0 text-sm font-medium text-foreground truncate">
                  {chef.chefName}
                </span>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-mustard to-mustard-dark"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-semibold text-foreground tabular-nums">
                  {chef.avgRank}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Chef Popularity */}
      <Section title="Chef Popularity" delay={500}>
        <div className="space-y-2.5">
          {data.chefPopularity.map((chef) => (
            <div key={chef.chefId} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-sm font-medium text-foreground truncate">
                {chef.chefName}
              </span>
              <div className="flex-1">
                <PopularityBar count={chef.count} max={maxPop} />
              </div>
              <span className="w-16 text-right text-sm text-muted-foreground">
                {chef.count} team{chef.count !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
        {data.undrafted.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold">Undrafted:</span>{" "}
            {data.undrafted.map((c) => c.name).join(", ")}
          </p>
        )}
      </Section>

      {/* About Draft Order */}
      <Section title="About Draft Order" delay={600}>
        <p className="text-sm text-muted-foreground mb-4">
          Without looking at results, I ran 1,000 simulations with different
          random seeds and picked the one that optimized for both the lowest
          average rank across all teams and the lowest worst-case team average.
          That seed was then used to randomize the draft order and run the
          draft.
        </p>
        <img
          src={distributionChart.src}
          alt="Distribution of overall average rank across 1,000 simulated drafts"
          className="w-full rounded-lg"
        />
        <p className="mt-3 mb-5 text-xs text-muted-foreground">
          Our draft (seed 250) sits at the far left — in the top 2.5% of
          fairest possible outcomes by overall average.
        </p>
        <img
          src={fairnessScatter.src}
          alt="Scatter plot of overall average rank vs worst team average rank across 1,000 simulated drafts"
          className="w-full rounded-lg"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Seed 249 is also the best on the second axis — no team has a worse
          average rank than 5.0, the lowest worst-case of any seed at the 4.25
          overall average.
        </p>
      </Section>

      {/* Footer flourish */}
      <div
        className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 animate-fade-in"
        style={{ animationDelay: "500ms" }}
      >
        <div className="h-px w-8 bg-border" />
        <span className="uppercase tracking-[0.2em]">Bon Appetit</span>
        <div className="h-px w-8 bg-border" />
      </div>
    </main>
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
