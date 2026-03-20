"use server";

import { getSupabase } from "./supabase";

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
