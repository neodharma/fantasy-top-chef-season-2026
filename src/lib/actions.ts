"use server";

import { getSupabase } from "./supabase";
import {
  deriveChefStatus,
  type ChefStatus,
  type EpisodeResult,
} from "./scoring";

interface ChefRanking {
  id: string;
  name: string;
}

interface SubmitResult {
  success: boolean;
  error?: string;
}

export async function submitDraft(
  teamName: string,
  ownerName: string,
  rankings: ChefRanking[]
): Promise<SubmitResult> {
  const trimmedTeam = teamName.trim();
  const trimmedOwner = ownerName.trim();

  if (!trimmedTeam || !trimmedOwner) {
    return { success: false, error: "Team name and owner name are required." };
  }

  if (rankings.length !== 15) {
    return { success: false, error: "All 15 chefs must be ranked." };
  }

  const supabase = getSupabase();

  // Insert submission
  const { data: submission, error: subError } = await supabase
    .from("draft_submissions")
    .insert({ team_name: trimmedTeam, owner_name: trimmedOwner })
    .select("id")
    .single();

  if (subError) {
    if (subError.code === "23505") {
      return {
        success: false,
        error: `Team name "${trimmedTeam}" has already been submitted.`,
      };
    }
    return { success: false, error: "Failed to submit draft. Please try again." };
  }

  // Insert picks
  const picks = rankings.map((chef, index) => ({
    submission_id: submission.id,
    chef_id: chef.id,
    chef_name: chef.name,
    rank: index + 1,
  }));

  const { error: picksError } = await supabase
    .from("draft_picks")
    .insert(picks);

  if (picksError) {
    // Clean up the submission on partial failure
    await supabase.from("draft_submissions").delete().eq("id", submission.id);
    return { success: false, error: "Failed to save rankings. Please try again." };
  }

  return { success: true };
}

interface ScoreEntry {
  chef_id: string;
  event: string;
}

interface ScoreResult {
  success: boolean;
  error?: string;
  inserted?: number;
}

export async function submitEpisodeScores(
  episode: number,
  entries: ScoreEntry[]
): Promise<ScoreResult> {
  if (episode < 1 || !Number.isInteger(episode)) {
    return { success: false, error: "Episode must be a positive integer." };
  }

  if (entries.length === 0) {
    return { success: false, error: "No events to submit." };
  }

  const supabase = getSupabase();

  // Delete any existing results for this episode, then insert fresh
  const { error: deleteError } = await supabase
    .from("episode_results")
    .delete()
    .eq("episode", episode);

  if (deleteError) {
    return { success: false, error: `Failed to clear existing episode data: ${deleteError.message}` };
  }

  const rows = entries.map((e) => ({
    episode,
    chef_id: e.chef_id,
    event: e.event,
  }));

  const { error: insertError } = await supabase
    .from("episode_results")
    .insert(rows);

  if (insertError) {
    return { success: false, error: `Failed to save episode scores: ${insertError.message}` };
  }

  return { success: true, inserted: rows.length };
}

export async function getEpisodeScores(
  episode: number
): Promise<{ chef_id: string; event: string }[]> {
  if (!Number.isInteger(episode) || episode < 1) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("episode_results")
    .select("chef_id, event")
    .eq("episode", episode);

  if (error) return [];
  return data ?? [];
}

export interface TeamSummary {
  teamName: string;
  ownerName: string;
}

export interface SurvivingChef {
  chefId: string;
  chefName: string;
  status: ChefStatus;
}

export async function listSurvivingChefs(): Promise<SurvivingChef[]> {
  const supabase = getSupabase();
  const { data: events } = await supabase.from("episode_results").select("*");
  const allEvents = (events ?? []) as EpisodeResult[];

  const eventsByChef = new Map<string, EpisodeResult[]>();
  for (const e of allEvents) {
    const arr = eventsByChef.get(e.chef_id) ?? [];
    arr.push(e);
    eventsByChef.set(e.chef_id, arr);
  }

  const { chefs } = await import("./chefs");
  return chefs
    .map((c) => ({
      chefId: c.id,
      chefName: c.name,
      status: deriveChefStatus(eventsByChef.get(c.id) ?? []),
    }))
    .filter((c) => c.status !== "Eliminated");
}

export async function listTeams(): Promise<TeamSummary[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("draft_submissions")
    .select("team_name, owner_name")
    .order("team_name", { ascending: true });

  if (error || !data) return [];
  return data.map((r) => ({ teamName: r.team_name, ownerName: r.owner_name }));
}

export interface TeamRosterChef {
  chefId: string;
  chefName: string;
  status: ChefStatus;
}

export interface TeamRoster {
  teamName: string;
  ownerName: string;
  chefs: TeamRosterChef[];
}

export async function getTeamRoster(
  teamName: string
): Promise<TeamRoster | null> {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const draftResults = (await import("@/app/results/draft-results.json"))
    .default as {
    rosters: {
      teamName: string;
      ownerName: string;
      picks: { chef_id: string; chef_name: string }[];
    }[];
  };
  const roster = draftResults.rosters.find((r) => r.teamName === trimmed);
  if (!roster) return null;

  const supabase = getSupabase();
  const { data: events } = await supabase.from("episode_results").select("*");

  const eventsByChef = new Map<string, EpisodeResult[]>();
  for (const e of (events ?? []) as EpisodeResult[]) {
    const arr = eventsByChef.get(e.chef_id) ?? [];
    arr.push(e);
    eventsByChef.set(e.chef_id, arr);
  }

  const chefs: TeamRosterChef[] = roster.picks.map((p) => ({
    chefId: p.chef_id,
    chefName: p.chef_name,
    status: deriveChefStatus(eventsByChef.get(p.chef_id) ?? []),
  }));

  return {
    teamName: roster.teamName,
    ownerName: roster.ownerName,
    chefs,
  };
}

export async function submitRedraft(
  teamName: string,
  keepChefId: string | null,
  rankings: ChefRanking[]
): Promise<SubmitResult> {
  const trimmedTeam = teamName.trim();
  if (!trimmedTeam) {
    return { success: false, error: "Team name is required." };
  }

  const supabase = getSupabase();

  const { data: original } = await supabase
    .from("draft_submissions")
    .select("id, team_name, owner_name")
    .eq("team_name", trimmedTeam)
    .maybeSingle();

  if (!original) {
    return {
      success: false,
      error: `No original draft found for team "${trimmedTeam}".`,
    };
  }

  // Determine the surviving chef pool from current episode_results.
  const { data: events } = await supabase.from("episode_results").select("*");
  const allEvents = (events ?? []) as EpisodeResult[];
  const eventsByChef = new Map<string, EpisodeResult[]>();
  for (const e of allEvents) {
    const arr = eventsByChef.get(e.chef_id) ?? [];
    arr.push(e);
    eventsByChef.set(e.chef_id, arr);
  }

  const { chefs } = await import("./chefs");
  const survivors = chefs.filter(
    (c) => deriveChefStatus(eventsByChef.get(c.id) ?? []) !== "Eliminated"
  );
  const survivorIds = new Set(survivors.map((c) => c.id));

  // Validate keep choice.
  if (keepChefId !== null) {
    if (!survivorIds.has(keepChefId)) {
      return {
        success: false,
        error: "Kept chef must currently be Active or In LCK.",
      };
    }

    const { data: ownsPick } = await supabase
      .from("draft_picks")
      .select("chef_id")
      .eq("submission_id", original.id)
      .eq("chef_id", keepChefId)
      .maybeSingle();

    if (!ownsPick) {
      return {
        success: false,
        error: "Kept chef must be on this team's original roster.",
      };
    }
  }

  // Validate rankings cover the surviving chefs minus the kept one, exactly.
  const expectedIds = new Set(survivorIds);
  if (keepChefId !== null) expectedIds.delete(keepChefId);

  if (rankings.length !== expectedIds.size) {
    return {
      success: false,
      error: `Expected ${expectedIds.size} ranked chefs, got ${rankings.length}.`,
    };
  }
  const submittedIds = new Set(rankings.map((r) => r.id));
  if (
    submittedIds.size !== expectedIds.size ||
    [...expectedIds].some((id) => !submittedIds.has(id))
  ) {
    return {
      success: false,
      error: "Ranked chefs do not match the redraftable pool.",
    };
  }

  const { data: insertedSub, error: subError } = await supabase
    .from("redraft_submissions")
    .insert({
      team_name: trimmedTeam,
      owner_name: original.owner_name,
      keep_chef_id: keepChefId,
    })
    .select("id")
    .single();

  if (subError) {
    if (subError.code === "23505") {
      return {
        success: false,
        error: `Team "${trimmedTeam}" has already submitted a redraft.`,
      };
    }
    return {
      success: false,
      error: `Failed to submit redraft: ${subError.message} (code ${subError.code ?? "unknown"})`,
    };
  }

  const pickRows = rankings.map((c, i) => ({
    submission_id: insertedSub.id,
    chef_id: c.id,
    chef_name: c.name,
    rank: i + 1,
  }));

  const { error: picksError } = await supabase
    .from("redraft_picks")
    .insert(pickRows);

  if (picksError) {
    await supabase
      .from("redraft_submissions")
      .delete()
      .eq("id", insertedSub.id);
    return {
      success: false,
      error: `Failed to save redraft rankings: ${picksError.message} (code ${picksError.code ?? "unknown"})`,
    };
  }

  return { success: true };
}

export interface ExistingRedraft {
  keepChefName: string | null;
  rankedChefs: string[];
  createdAt: string;
}

export async function getRedraftSubmission(
  teamName: string
): Promise<ExistingRedraft | null> {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from("redraft_submissions")
    .select("id, keep_chef_id, created_at")
    .eq("team_name", trimmed)
    .maybeSingle();

  if (!sub) return null;

  const { data: picks } = await supabase
    .from("redraft_picks")
    .select("chef_name, rank")
    .eq("submission_id", sub.id)
    .order("rank", { ascending: true });

  const { chefs } = await import("./chefs");
  const keepChefName = sub.keep_chef_id
    ? (chefs.find((c) => c.id === sub.keep_chef_id)?.name ?? sub.keep_chef_id)
    : null;

  return {
    keepChefName,
    rankedChefs: (picks ?? []).map((p) => p.chef_name),
    createdAt: sub.created_at,
  };
}

export async function deleteRedraft(teamName: string): Promise<SubmitResult> {
  const trimmed = teamName.trim();
  if (!trimmed) return { success: false, error: "Team name is required." };

  const supabase = getSupabase();
  const { error } = await supabase
    .from("redraft_submissions")
    .delete()
    .eq("team_name", trimmed);

  if (error) {
    return {
      success: false,
      error: `Failed to delete redraft: ${error.message} (code ${error.code ?? "unknown"})`,
    };
  }
  return { success: true };
}
