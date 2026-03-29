export const dynamic = "force-dynamic";

import { getSupabase } from "@/lib/supabase";
import { chefs } from "@/lib/chefs";
import {
  POINT_VALUES,
  type EpisodeResult,
  type EventType,
} from "@/lib/scoring";
import draftResults from "../results/draft-results.json";
import { TeamTable } from "./team-table";

interface Roster {
  teamName: string;
  ownerName: string;
  picks: { chef_id: string; chef_name: string }[];
}

const data = draftResults as { rosters: Roster[] };

const chefNameMap = Object.fromEntries(chefs.map((c) => [c.id, c.name]));

const EVENT_LABELS: Record<EventType, string> = {
  quickfire_win: "QF Win",
  quickfire_top: "QF Top",
  quickfire_bottom: "QF Bottom",
  elimination_win: "Elim Win",
  elimination_top: "Elim Top",
  elimination_bottom: "Elim Bottom",
  lck_win: "LCK Win",
  sent_to_lck: "Sent to LCK",
  eliminated: "Eliminated",
  bonus_risotto: "Risotto",
  bonus_cries: "Cries",
  bonus_incomplete_plate: "Incomplete Plate",
  bonus_forgot_ingredient: "Forgot Ingredient",
  bonus_liquid_nitrogen: "Liquid Nitrogen",
};

const EVENT_STYLES: Record<EventType, string> = {
  quickfire_win: "bg-green-100 text-green-800",
  quickfire_top: "bg-green-50 text-green-700",
  quickfire_bottom: "bg-red-50 text-red-700",
  elimination_win: "bg-green-100 text-green-800",
  elimination_top: "bg-green-50 text-green-700",
  elimination_bottom: "bg-red-50 text-red-700",
  lck_win: "bg-mustard-light/40 text-mustard-dark",
  sent_to_lck: "bg-orange-100 text-orange-800",
  eliminated: "bg-red-100 text-red-800",
  bonus_risotto: "bg-purple-50 text-purple-700",
  bonus_cries: "bg-purple-50 text-purple-700",
  bonus_incomplete_plate: "bg-purple-50 text-purple-700",
  bonus_forgot_ingredient: "bg-purple-50 text-purple-700",
  bonus_liquid_nitrogen: "bg-purple-50 text-purple-700",
};

function EventBadge({ event }: { event: EventType }) {
  const pts = POINT_VALUES[event];
  const ptsStr =
    pts === 0 ? "" : pts > 0 ? ` +${pts}` : ` ${pts}`;
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-tight font-semibold ${EVENT_STYLES[event]}`}
    >
      {EVENT_LABELS[event]}
      {ptsStr && (
        <span className="ml-0.5 opacity-70">{ptsStr}</span>
      )}
    </span>
  );
}

async function loadEpisodeData() {
  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from("episode_results")
    .select("*")
    .order("episode", { ascending: true });

  const results = (rows ?? []) as EpisodeResult[];
  const episodes = [...new Set(results.map((r) => r.episode))].sort(
    (a, b) => a - b
  );

  // Build lookup: chefId -> episode -> events
  const chefEpEvents = new Map<string, Map<number, EpisodeResult[]>>();
  for (const r of results) {
    if (!chefEpEvents.has(r.chef_id)) chefEpEvents.set(r.chef_id, new Map());
    const epMap = chefEpEvents.get(r.chef_id)!;
    if (!epMap.has(r.episode)) epMap.set(r.episode, []);
    epMap.get(r.episode)!.push(r);
  }

  // Build team data for the client component
  // teamName -> episode -> { totalPoints, chefBreakdown[] }
  const teamEpData: Record<
    string,
    Record<
      number,
      {
        totalPoints: number;
        chefs: { name: string; events: string[]; points: number }[];
      }
    >
  > = {};

  for (const roster of data.rosters) {
    teamEpData[roster.teamName] = {};
    for (const ep of episodes) {
      let totalPoints = 0;
      const chefBreakdowns: {
        name: string;
        events: string[];
        points: number;
      }[] = [];

      for (const pick of roster.picks) {
        const events = chefEpEvents.get(pick.chef_id)?.get(ep) ?? [];
        if (events.length === 0) continue;
        const pts = events.reduce((s, e) => s + POINT_VALUES[e.event], 0);
        totalPoints += pts;
        chefBreakdowns.push({
          name: chefNameMap[pick.chef_id] ?? pick.chef_id,
          events: events.map((e) => EVENT_LABELS[e.event]),
          points: pts,
        });
      }

      if (chefBreakdowns.length > 0) {
        teamEpData[roster.teamName][ep] = {
          totalPoints,
          chefs: chefBreakdowns,
        };
      }
    }
  }

  // Compute team cumulative totals for sorting
  const teamTotals: Record<string, number> = {};
  for (const roster of data.rosters) {
    teamTotals[roster.teamName] = Object.values(
      teamEpData[roster.teamName]
    ).reduce((s, ep) => s + ep.totalPoints, 0);
  }

  return { chefEpEvents, episodes, teamEpData, teamTotals };
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

export default async function EpisodesPage() {
  const { chefEpEvents, episodes, teamEpData, teamTotals } =
    await loadEpisodeData();

  if (episodes.length === 0) {
    return (
      <main className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <div className="text-center animate-fade-in">
          <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Epi<span className="text-mustard-dark">sodes</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            No episodes scored yet.
          </p>
        </div>
      </main>
    );
  }

  // Sort chefs by total points descending
  const sortedChefs = chefs
    .map((c) => {
      const epMap = chefEpEvents.get(c.id);
      let total = 0;
      if (epMap) {
        for (const events of epMap.values()) {
          total += events.reduce((s, e) => s + POINT_VALUES[e.event], 0);
        }
      }
      return { ...c, total };
    })
    .sort((a, b) => b.total - a.total);

  // Sort rosters by total points for team table
  const sortedRosters = [...data.rosters].sort(
    (a, b) => (teamTotals[b.teamName] ?? 0) - (teamTotals[a.teamName] ?? 0)
  );

  return (
    <main className="relative mx-auto max-w-4xl px-5 py-16 sm:py-24">
      {/* Decorative top accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-mustard/40 to-transparent" />

      {/* Header */}
      <div className="mb-14 text-center animate-fade-in">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Epi<span className="text-mustard-dark">sodes</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Results by episode
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

      {/* Chef Results Table */}
      <Section title="Chef Results by Episode" delay={100}>
        <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 overscroll-x-contain snap-x snap-proximity">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-1.5 pr-2 sm:py-2 sm:pr-3 text-center font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                  Chef
                </th>
                {episodes.map((ep) => (
                  <th
                    key={ep}
                    className="py-1.5 px-2 sm:py-2 sm:px-3 text-center font-semibold text-muted-foreground min-w-[76px] sm:min-w-[100px] border-l border-border/30 snap-start"
                  >
                    Ep {ep}
                  </th>
                ))}
                <th className="py-1.5 pl-2 sm:py-2 sm:pl-3 text-center font-semibold text-muted-foreground border-l border-border/30">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sortedChefs.map((chef, i) => {
                const epMap = chefEpEvents.get(chef.id);
                return (
                  <tr
                    key={chef.id}
                    className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <td className={`py-2 pr-2 sm:py-2.5 sm:pr-3 font-semibold text-foreground whitespace-nowrap sticky left-0 text-center ${i % 2 === 0 ? "bg-card" : "bg-secondary"}`}>
                      {chef.name}
                    </td>
                    {episodes.map((ep) => {
                      const events = epMap?.get(ep) ?? [];
                      if (events.length === 0) {
                        return (
                          <td
                            key={ep}
                            className="py-2 px-2 sm:py-2.5 sm:px-3 text-center text-muted-foreground/40 border-l border-border/30"
                          >
                            &mdash;
                          </td>
                        );
                      }
                      return (
                        <td key={ep} className="py-2 px-2 sm:py-2.5 sm:px-3 border-l border-border/30">
                          <div className="flex flex-wrap justify-center gap-1">
                            {events.map((e) => (
                              <EventBadge key={e.event} event={e.event} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 pl-2 sm:py-2.5 sm:pl-3 text-center font-bold text-foreground font-mono border-l border-border/30">
                      {chef.total.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Team Rollup Table */}
      <Section title="Team Scores by Episode" delay={200}>
        <TeamTable
          rosters={sortedRosters.map((r) => ({
            teamName: r.teamName,
            ownerName: r.ownerName,
          }))}
          episodes={episodes}
          teamEpData={teamEpData}
          teamTotals={teamTotals}
        />
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
