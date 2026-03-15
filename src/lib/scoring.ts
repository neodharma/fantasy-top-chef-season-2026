export type EventType =
  | "quickfire_win"
  | "quickfire_top"
  | "quickfire_bottom"
  | "elimination_win"
  | "elimination_top"
  | "elimination_bottom"
  | "lck_win"
  | "sent_to_lck"
  | "eliminated";

export type ChefStatus = "Active" | "In LCK" | "Eliminated";

export interface EpisodeResult {
  id: string;
  episode: number;
  chef_id: string;
  event: EventType;
  created_at: string;
}

export interface ChefStanding {
  chefId: string;
  chefName: string;
  points: number;
  status: ChefStatus;
}

export interface TeamStanding {
  teamName: string;
  ownerName: string;
  totalPoints: number;
  chefs: ChefStanding[];
}

export const POINT_VALUES: Record<EventType, number> = {
  quickfire_win: 1.5,
  quickfire_top: 1,
  quickfire_bottom: -1,
  elimination_win: 2,
  elimination_top: 1,
  elimination_bottom: -1,
  lck_win: 1,
  sent_to_lck: 0,
  eliminated: 0,
};

/** Main-competition events (i.e. not LCK-only or status-only) */
const MAIN_EVENTS: Set<EventType> = new Set([
  "quickfire_win",
  "quickfire_top",
  "quickfire_bottom",
  "elimination_win",
  "elimination_top",
  "elimination_bottom",
]);

export function computeChefPoints(events: EpisodeResult[]): number {
  return events.reduce((sum, e) => sum + POINT_VALUES[e.event], 0);
}

export function deriveChefStatus(events: EpisodeResult[]): ChefStatus {
  if (events.length === 0) return "Active";

  // Find the latest episode number
  const maxEp = Math.max(...events.map((e) => e.episode));

  // Walk backwards from the latest episode
  for (let ep = maxEp; ep >= 1; ep--) {
    const epEvents = events.filter((e) => e.episode === ep);
    if (epEvents.length === 0) continue;

    // Within an episode, status events (eliminated/sent_to_lck) take priority
    // because they happen at the end of the episode
    const hasEliminated = epEvents.some((e) => e.event === "eliminated");
    if (hasEliminated) return "Eliminated";

    const hasSentToLck = epEvents.some((e) => e.event === "sent_to_lck");
    if (hasSentToLck) return "In LCK";

    // If this episode has main-competition events (or lck_win), chef is active
    const hasMainOrLck = epEvents.some(
      (e) => MAIN_EVENTS.has(e.event) || e.event === "lck_win"
    );
    if (hasMainOrLck) return "Active";
  }

  return "Active";
}
