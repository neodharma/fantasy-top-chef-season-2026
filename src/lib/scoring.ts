export type EventType =
  | "quickfire_win"
  | "quickfire_top"
  | "quickfire_bottom"
  | "elimination_win"
  | "elimination_top"
  | "elimination_bottom"
  | "lck_win"
  | "sent_to_lck"
  | "eliminated"
  | "returned_to_competition"
  | "bonus_risotto"
  | "bonus_cries"
  | "bonus_incomplete_plate"
  | "bonus_forgot_ingredient"
  | "bonus_liquid_nitrogen";

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
  returned_to_competition: 0,
  bonus_risotto: 0.5,
  bonus_cries: 0.5,
  bonus_incomplete_plate: 0.5,
  bonus_forgot_ingredient: 0.5,
  bonus_liquid_nitrogen: 0.5,
};

export function computeChefPoints(events: EpisodeResult[]): number {
  return events.reduce((sum, e) => sum + POINT_VALUES[e.event], 0);
}

export function deriveChefStatus(events: EpisodeResult[]): ChefStatus {
  const ordered = [...events].sort((a, b) => {
    if (a.episode !== b.episode) return a.episode - b.episode;
    return a.created_at.localeCompare(b.created_at);
  });

  let status: ChefStatus = "Active";
  for (const e of ordered) {
    if (e.event === "eliminated") return "Eliminated";
    if (e.event === "sent_to_lck") status = "In LCK";
    else if (e.event === "returned_to_competition") status = "Active";
  }
  return status;
}
