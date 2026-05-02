export const dynamic = "force-dynamic";

import { getSupabase } from "@/lib/supabase";
import { chefs } from "@/lib/chefs";
import {
  POINT_VALUES,
  computeChefPoints,
  deriveChefStatus,
  type EpisodeResult,
  type ChefStanding,
  type ChefStatus,
} from "@/lib/scoring";
import draftResults from "../results/draft-results.json";
import redraftResults from "../results/redraft-results.json";
import { type EpisodeBreakdown } from "./chef-score";
import { TeamRosterCard, type TeamCardChef } from "./team-roster-card";

const EVENT_LABELS: Record<string, string> = {
  quickfire_win: "QF Win",
  quickfire_top: "QF Top",
  quickfire_bottom: "QF Bottom",
  elimination_win: "Elim Win",
  elimination_top: "Elim Top",
  elimination_bottom: "Elim Bottom",
  lck_win: "LCK Win",
  sent_to_lck: "Sent to LCK",
  eliminated: "Eliminated",
  returned_to_competition: "Returned to Comp",
  bonus_risotto: "Risotto",
  bonus_cries: "Cries",
  bonus_incomplete_plate: "Incomplete Plate",
  bonus_forgot_ingredient: "Forgot Ingredient",
  bonus_liquid_nitrogen: "Liquid Nitrogen",
};

interface OriginalRoster {
  teamName: string;
  ownerName: string;
  picks: { chef_id: string; chef_name: string }[];
}

interface RedraftRosterPick {
  chef_id: string;
  chef_name: string;
  kept?: boolean;
}

interface RedraftRoster {
  teamName: string;
  ownerName: string;
  keepChefId: string | null;
  picks: RedraftRosterPick[];
}

const draft = draftResults as { rosters: OriginalRoster[] };
const redraft = redraftResults as {
  effectiveFromEpisode: number | null;
  rosters: RedraftRoster[];
};

const hasRedraft =
  redraft.effectiveFromEpisode !== null && redraft.rosters.length > 0;

interface TeamRow {
  teamName: string;
  ownerName: string;
  totalPoints: number;
  originalChefs: TeamCardChef[];
  originalSubtotal: number;
  redraftChefs: TeamCardChef[] | null;
  redraftSubtotal: number;
}

async function loadStandings(): Promise<{
  teams: TeamRow[];
  allChefs: ChefStanding[];
  maxEpisode: number;
}> {
  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from("episode_results")
    .select("*")
    .order("episode", { ascending: true });

  const results = (rows ?? []) as EpisodeResult[];
  const maxEpisode = results.reduce((m, r) => Math.max(m, r.episode), 0);

  const byChef = new Map<string, EpisodeResult[]>();
  for (const r of results) {
    const arr = byChef.get(r.chef_id) ?? [];
    arr.push(r);
    byChef.set(r.chef_id, arr);
  }

  const allChefs: ChefStanding[] = chefs.map((c) => {
    const events = byChef.get(c.id) ?? [];
    return {
      chefId: c.id,
      chefName: c.name,
      points: computeChefPoints(events),
      status: deriveChefStatus(events),
    };
  });
  const chefStatusById = new Map(allChefs.map((c) => [c.chefId, c.status]));

  const phaseSplit = hasRedraft ? redraft.effectiveFromEpisode! : Infinity;

  const buildBreakdown = (
    events: EpisodeResult[],
    epFilter: (ep: number) => boolean
  ): { points: number; episodes: EpisodeBreakdown[] } => {
    const filtered = events.filter((e) => epFilter(e.episode));
    const byEp = new Map<number, EpisodeResult[]>();
    for (const e of filtered) {
      const arr = byEp.get(e.episode) ?? [];
      arr.push(e);
      byEp.set(e.episode, arr);
    }
    const episodes: EpisodeBreakdown[] = [...byEp.entries()]
      .sort(([a], [b]) => a - b)
      .map(([episode, epEvents]) => ({
        episode,
        events: epEvents.map((e) => ({
          label: EVENT_LABELS[e.event] ?? e.event,
          points: POINT_VALUES[e.event],
        })),
        total: epEvents.reduce((s, e) => s + POINT_VALUES[e.event], 0),
      }));
    return {
      points: filtered.reduce((s, e) => s + POINT_VALUES[e.event], 0),
      episodes,
    };
  };

  const buildChefRow = (
    chefId: string,
    chefName: string,
    epFilter: (ep: number) => boolean,
    kept = false
  ): TeamCardChef => {
    const { points, episodes } = buildBreakdown(
      byChef.get(chefId) ?? [],
      epFilter
    );
    return {
      chefId,
      chefName,
      status: chefStatusById.get(chefId) ?? "Active",
      points,
      episodes,
      kept,
    };
  };

  const inOriginalPhase = (ep: number) => ep < phaseSplit;
  const inRedraftPhase = (ep: number) => ep >= phaseSplit;

  const redraftByTeam = new Map<string, RedraftRoster>();
  for (const r of redraft.rosters) redraftByTeam.set(r.teamName, r);

  const teams: TeamRow[] = draft.rosters.map((roster) => {
    const originalChefs = roster.picks.map((p) =>
      buildChefRow(p.chef_id, p.chef_name, inOriginalPhase)
    );
    const originalSubtotal = originalChefs.reduce((s, c) => s + c.points, 0);

    let redraftChefs: TeamCardChef[] | null = null;
    let redraftSubtotal = 0;
    if (hasRedraft) {
      const r = redraftByTeam.get(roster.teamName);
      if (r) {
        redraftChefs = r.picks.map((p) =>
          buildChefRow(p.chef_id, p.chef_name, inRedraftPhase, p.kept)
        );
        redraftSubtotal = redraftChefs.reduce((s, c) => s + c.points, 0);
      } else {
        redraftChefs = [];
      }
    }

    return {
      teamName: roster.teamName,
      ownerName: roster.ownerName,
      totalPoints: originalSubtotal + redraftSubtotal,
      originalChefs,
      originalSubtotal,
      redraftChefs,
      redraftSubtotal,
    };
  });

  teams.sort((a, b) => b.totalPoints - a.totalPoints);
  allChefs.sort((a, b) => b.points - a.points);

  return { teams, allChefs, maxEpisode };
}

function StatusBadge({ status }: { status: ChefStatus }) {
  const styles: Record<ChefStatus, string> = {
    Active: "bg-green-100 text-green-800",
    "In LCK": "bg-mustard-light/40 text-mustard-dark",
    Eliminated: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
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

export default async function StandingsPage() {
  const { teams, allChefs, maxEpisode } = await loadStandings();

  const maxChefPts = Math.max(...allChefs.map((c) => c.points), 1);

  return (
    <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      <div className="mb-14 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Stand
          <span className="text-mustard-dark">ings</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {maxEpisode > 0
            ? `Through Episode ${maxEpisode}`
            : "No episodes scored yet"}
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
      </div>

      <Section title="Team Standings" delay={100}>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="py-2 px-2 text-center font-semibold text-muted-foreground w-10">
                  #
                </th>
                <th className="py-2 px-2 text-center font-semibold text-muted-foreground">
                  Team
                </th>
                <th className="py-2 px-2 text-center font-semibold text-muted-foreground hidden sm:table-cell">
                  Owner
                </th>
                <th className="py-2 px-2 text-center font-semibold text-muted-foreground">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {teams.map((team, i) => (
                <tr
                  key={team.teamName}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                >
                  <td className="py-2.5 px-2 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mustard/15 text-sm font-bold text-mustard-dark">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-foreground">
                    {team.teamName}
                  </td>
                  <td className="py-2.5 px-2 text-center font-medium text-muted-foreground hidden sm:table-cell">
                    {team.ownerName}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-foreground font-mono">
                    {team.totalPoints.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Team Rosters" delay={200}>
        <p className="text-sm text-muted-foreground mb-4">
          Hover over a chef&apos;s score (or tap on mobile) to see their episode-by-episode breakdown.
          {hasRedraft && " Toggle each card between the redraft and original-draft rosters."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <TeamRosterCard
              key={team.teamName}
              teamName={team.teamName}
              ownerName={team.ownerName}
              totalPoints={team.totalPoints}
              originalChefs={team.originalChefs}
              originalSubtotal={team.originalSubtotal}
              redraftChefs={team.redraftChefs}
              redraftSubtotal={team.redraftSubtotal}
            />
          ))}
        </div>
      </Section>

      <Section title="Chef Leaderboard" delay={300}>
        <div className="space-y-2">
          {allChefs.map((chef, i) => {
            const pct =
              maxChefPts > 0 ? (Math.max(chef.points, 0) / maxChefPts) * 100 : 0;
            return (
              <div key={chef.chefId} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mustard/15 text-xs font-bold text-mustard-dark">
                  {i + 1}
                </span>
                <span className="w-44 shrink-0 text-sm font-semibold text-foreground truncate">
                  {chef.chefName}
                </span>
                <StatusBadge status={chef.status} />
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-mustard to-mustard-dark"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-bold text-foreground font-mono">
                  {chef.points.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

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
