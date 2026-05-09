import redraftResults from "../results/redraft-results.json";

interface RedraftPick {
  round_num: number;
  pick_num: number;
  team_name: string;
  chef_id: string;
  chef_name: string;
  rank_on_list: number;
  kept?: boolean;
}

interface RedraftRoster {
  teamName: string;
  ownerName: string;
  keepChefId: string | null;
  picks: RedraftPick[];
}

interface ChefDesirability {
  chefId: string;
  chefName: string;
  avgRank: number;
  numKept: number;
  numTeams: number;
}

interface StandingsRow {
  teamName: string;
  ownerName: string;
  points: number;
}

interface RedraftData {
  effectiveFromEpisode: number | null;
  draftOrder: { teamName: string; ownerName: string }[];
  standingsAtRedraft?: StandingsRow[];
  chefDesirability?: ChefDesirability[];
  picks: RedraftPick[];
  rosters: RedraftRoster[];
  numTeams: number;
}

const data = redraftResults as RedraftData;
const hasRedraft =
  data.effectiveFromEpisode !== null && data.rosters.length > 0;

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

export default function RedraftResultsPage() {
  if (!hasRedraft) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Redraft Results
        </h1>
        <p className="mt-6 text-muted-foreground">
          The redraft hasn&rsquo;t been run yet.
        </p>
      </main>
    );
  }

  const rounds = Array.from(
    new Set(data.picks.map((p) => p.round_num))
  ).sort((a, b) => a - b);

  return (
    <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      {/* Header */}
      <div className="mb-14 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Redraft
          <br />
          <span className="text-mustard-dark">Results</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Mid-season &middot; effective from episode{" "}
          {data.effectiveFromEpisode}
        </p>

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
          {data.numTeams} teams, {data.chefDesirability?.length ?? 0} surviving chefs.
          Each team optionally kept one and drafted to fill 3 roster slots.
          Points from episodes 1–{(data.effectiveFromEpisode ?? 9) - 1} stay
          with original-draft owners.
        </p>
      </div>

      {/* Standings going in */}
      {data.standingsAtRedraft && (
        <Section title="Standings Going In" delay={50}>
          <p className="text-sm text-muted-foreground mb-4">
            Pick order is reverse current standings — the team in last place
            picks first.
          </p>
          <ol className="space-y-1">
            {data.standingsAtRedraft.map((row, i) => (
              <li
                key={row.teamName}
                className="flex items-center gap-3 py-1.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mustard/15 text-sm font-bold text-mustard-dark">
                  {i + 1}
                </span>
                <span className="font-semibold text-foreground flex-1 truncate">
                  {row.teamName}
                </span>
                <span className="text-muted-foreground text-sm hidden sm:inline">
                  {row.ownerName}
                </span>
                <span className="w-12 text-right text-sm font-semibold text-foreground tabular-nums">
                  {row.points.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Rosters */}
      <Section title="Final Rosters" delay={100}>
        <p className="text-sm text-muted-foreground mb-4">
          Listed in pick order (worst-first). Each roster shows the kept chef
          (if any) plus drafted picks with their rank on that team&rsquo;s
          submitted list.
        </p>
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
                  {roster.ownerName}
                </p>
              </div>
              <ul className="divide-y divide-border/40 px-5">
                {roster.picks.map((pick) => (
                  <li
                    key={pick.chef_id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-muted-foreground w-10">
                        {pick.kept ? "Keep" : `R${pick.round_num}`}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {pick.chef_name}
                      </span>
                    </div>
                    {!pick.kept && <RankBadge rank={pick.rank_on_list} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Chef desirability */}
      {data.chefDesirability && (
        <Section title="Chef Desirability" delay={150}>
          <p className="text-sm text-muted-foreground mb-4">
            Average rank across all {data.numTeams} teams&rsquo; submissions
            (lower = more wanted). A team&rsquo;s kept chef counts as their #1
            since they&rsquo;d have ranked them there.
          </p>
          <div className="space-y-2">
            {data.chefDesirability.map((chef, i) => {
              const best = data.chefDesirability![0].avgRank;
              const worst =
                data.chefDesirability![data.chefDesirability!.length - 1]
                  .avgRank;
              const pct =
                worst === best
                  ? 100
                  : ((worst - chef.avgRank) / (worst - best)) * 100;
              return (
                <div key={chef.chefId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mustard/15 text-xs font-bold text-mustard-dark">
                    {i + 1}
                  </span>
                  <span className="w-36 sm:w-44 shrink-0 text-sm font-medium text-foreground truncate">
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
                    {chef.avgRank.toFixed(1)}
                  </span>
                  <span
                    className="w-14 text-right text-xs text-muted-foreground tabular-nums hidden sm:inline"
                    title={`${chef.numKept} team${chef.numKept !== 1 ? "s" : ""} kept this chef`}
                  >
                    {chef.numKept > 0
                      ? `${chef.numKept} kept`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Fun facts */}
      <Section title="Fun Facts" delay={200}>
        <ul className="space-y-3 text-sm text-foreground/85 leading-relaxed">
          <li>
            <span className="font-semibold text-foreground">
              All 10 round-1 picks were each team&rsquo;s submitted #1.
            </span>{" "}
            Demand was concentrated, but the per-chef cap of 4 didn&rsquo;t
            bind until round 2 — so every team walked away with their top
            choice in the first round.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Round 2 was the great equalizer.
            </span>{" "}
            Average pick rank jumped from #1.0 in R1 to #3.0 in R2 as the
            most-wanted chefs hit the 4-team cap and forced teams down their
            lists.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Anthony Jones was the most-trusted holdover.
            </span>{" "}
            Three teams kept him (Tom&rsquo;s Nom&rsquo;s, House Young,
            Vigilante Shrimp 2.0), and Padma&rsquo;s Angels grabbed him with
            the 2nd overall pick — putting him at the cap before round 1 was
            half done.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Sherry Cardoso is the redraft&rsquo;s most-shared chef.
            </span>{" "}
            Nobody kept her, but she still ended on 4 teams. With an average
            submitted rank of #3.3, she was the highest-rated survivor that
            no one had on their original roster.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Sieger Bayer is the redraft&rsquo;s least-wanted survivor
            </span>{" "}
            (avg rank #4.7), kept by only Rising Phoenix. He still landed on
            3 teams thanks to the cap math — somebody had to fill the slack.
          </li>
        </ul>
      </Section>

      {/* Pick log */}
      <Section title="Pick-by-Pick" delay={300}>
        <div className="space-y-6">
          {rounds.map((round) => {
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
                          <td className="py-2 pl-4 pr-2 w-12 text-muted-foreground font-mono text-xs">
                            {pick.pick_num}
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

      <div
        className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 animate-fade-in"
        style={{ animationDelay: "500ms" }}
      >
        <div className="h-px w-8 bg-border" />
        <span className="uppercase tracking-[0.2em]">Round Two</span>
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
