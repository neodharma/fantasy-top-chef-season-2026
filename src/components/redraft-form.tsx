"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChefRanking } from "./chef-ranking";
import type { Chef } from "@/lib/chefs";
import {
  deleteRedraft,
  getRedraftSubmission,
  getTeamRoster,
  listSurvivingChefs,
  listTeams,
  submitRedraft,
  type ExistingRedraft,
  type SurvivingChef,
  type TeamRoster,
  type TeamSummary,
} from "@/lib/actions";
import type { ChefStatus } from "@/lib/scoring";

const KEEP_NONE = "__none__";

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

export function RedraftForm() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [survivors, setSurvivors] = useState<SurvivingChef[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [keepChoice, setKeepChoice] = useState<string>(KEEP_NONE);
  const [ranked, setRanked] = useState<Chef[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingRedraft | null>(null);
  const [overwriteStage, setOverwriteStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    listTeams().then(setTeams);
    listSurvivingChefs().then(setSurvivors);
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      setRoster(null);
      setExisting(null);
      setOverwriteStage(0);
      return;
    }
    let ignore = false;
    setLoadingRoster(true);
    setError(null);
    setOverwriteStage(0);
    Promise.all([
      getTeamRoster(selectedTeam),
      getRedraftSubmission(selectedTeam),
    ]).then(([r, ex]) => {
      if (ignore) return;
      setRoster(r);
      setExisting(ex);
      setKeepChoice(KEEP_NONE);
      setRanked([]);
      setLoadingRoster(false);
    });
    return () => {
      ignore = true;
    };
  }, [selectedTeam]);

  const redraftablePool = useMemo<Chef[]>(() => {
    return survivors
      .filter((c) => keepChoice === KEEP_NONE || c.chefId !== keepChoice)
      .map((c) => ({ id: c.chefId, name: c.chefName }));
  }, [survivors, keepChoice]);

  useEffect(() => {
    setRanked((prev) =>
      prev.filter((c) => redraftablePool.some((p) => p.id === c.id))
    );
  }, [redraftablePool]);

  const unranked = redraftablePool.filter(
    (c) => !ranked.some((r) => r.id === c.id)
  );

  const allPicked =
    redraftablePool.length > 0 && ranked.length === redraftablePool.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await submitRedraft(
      selectedTeam,
      keepChoice === KEEP_NONE ? null : keepChoice,
      ranked
    );

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  async function handleDeleteAndRedo() {
    if (!selectedTeam) return;
    setDeleting(true);
    setError(null);
    const result = await deleteRedraft(selectedTeam);
    setDeleting(false);
    if (!result.success) {
      setError(result.error ?? "Failed to delete.");
      return;
    }
    setKeepChoice(KEEP_NONE);
    setRanked([]);
    setSubmitted(false);
    setExisting(null);
    setOverwriteStage(0);
  }

  async function handleConfirmOverwrite() {
    if (!selectedTeam) return;
    setDeleting(true);
    setError(null);
    const result = await deleteRedraft(selectedTeam);
    setDeleting(false);
    if (!result.success) {
      setError(result.error ?? "Failed to delete existing draft.");
      return;
    }
    setExisting(null);
    setOverwriteStage(0);
  }

  if (submitted && roster) {
    const keptName =
      keepChoice === KEEP_NONE
        ? null
        : roster.chefs.find((c) => c.chefId === keepChoice)?.chefName;
    return (
      <div className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden animate-scale-in">
        <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.08] to-transparent px-6 py-8 sm:px-8 text-center">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mustard/15 border border-mustard/25">
            <svg
              className="h-7 w-7 text-mustard-dark"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Redraft Locked In
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Thanks,{" "}
            <span className="font-semibold text-foreground">
              {roster.ownerName}
            </span>{" "}
            — your picks are submitted
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8">
          {keptName && (
            <p className="mb-4 text-sm">
              <span className="text-muted-foreground">Keeping: </span>
              <span className="font-semibold text-foreground">{keptName}</span>
            </p>
          )}
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Your Redraft Rankings
          </h3>
          <div className="space-y-1">
            {ranked.map((chef, index) => (
              <div key={chef.id} className="flex items-center gap-3 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-base text-foreground/80">
                  {chef.name}
                </span>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleDeleteAndRedo}
            disabled={deleting}
            className="mt-6 text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-destructive transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete this draft and re-do"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden">
      <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-6 py-5 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Submit Your Redraft
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          Pick one chef to keep (or none), then rank the rest
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label
              htmlFor="teamSelect"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Team
            </label>
            <select
              id="teamSelect"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              required
              className="w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm font-medium text-foreground focus:border-mustard/40 focus:ring-mustard/20 focus:outline-none"
            >
              <option value="">— select your team —</option>
              {teams.map((t) => (
                <option key={t.teamName} value={t.teamName}>
                  {t.teamName} ({t.ownerName})
                </option>
              ))}
            </select>
          </div>

          {loadingRoster && (
            <p className="text-sm text-muted-foreground">Loading roster…</p>
          )}

          {roster && existing && overwriteStage < 2 && (
            <div className="rounded-lg border border-mustard/40 bg-mustard/[0.06] px-4 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  A redraft has already been submitted for this team.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(existing.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {overwriteStage === 0 && (
                <button
                  type="button"
                  onClick={() => setOverwriteStage(1)}
                  className="text-xs font-semibold text-mustard-dark underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors"
                >
                  Continue and overwrite this submission
                </button>
              )}

              {overwriteStage === 1 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/[0.04] px-3 py-3 space-y-2">
                  <p className="text-sm font-semibold text-destructive">
                    This will permanently delete the existing redraft.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The previous keep choice and ranked list will be lost. This
                    cannot be undone. Please don&apos;t do this unless it&apos;s
                    your team.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmOverwrite}
                      disabled={deleting}
                      className="rounded-md bg-destructive px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Yes, overwrite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverwriteStage(0)}
                      disabled={deleting}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs text-destructive pt-1">{error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {roster && (!existing || overwriteStage === 2) && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Keep one chef (optional)
                </h3>
                <div className="space-y-2">
                  {roster.chefs.map((chef) => {
                    const eligible = chef.status !== "Eliminated";
                    const id = `keep-${chef.chefId}`;
                    return (
                      <label
                        key={chef.chefId}
                        htmlFor={id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                          eligible
                            ? "border-border/60 bg-background/40 hover:border-mustard/40 cursor-pointer"
                            : "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name="keep"
                          value={chef.chefId}
                          checked={keepChoice === chef.chefId}
                          disabled={!eligible}
                          onChange={() => setKeepChoice(chef.chefId)}
                          className="h-4 w-4 accent-mustard-dark"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {chef.chefName}
                        </span>
                        <StatusBadge status={chef.status} />
                      </label>
                    );
                  })}
                  <label
                    htmlFor="keep-none"
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 hover:border-mustard/40 cursor-pointer"
                  >
                    <input
                      id="keep-none"
                      type="radio"
                      name="keep"
                      value={KEEP_NONE}
                      checked={keepChoice === KEEP_NONE}
                      onChange={() => setKeepChoice(KEEP_NONE)}
                      className="h-4 w-4 accent-mustard-dark"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Keep none
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Redraft 3 chefs from scratch
                    </span>
                  </label>
                </div>
              </div>

              <ChefRanking
                ranked={ranked}
                unranked={unranked}
                onReorder={setRanked}
                onPick={(chef) => setRanked((p) => [...p, chef])}
                onRemove={(chef) =>
                  setRanked((p) => p.filter((c) => c.id !== chef.id))
                }
              />

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-mustard-dark hover:bg-mustard text-white font-bold tracking-wide py-3 h-12 text-base uppercase transition-all duration-200 hover:shadow-md"
                disabled={submitting || !allPicked}
              >
                {submitting
                  ? "Submitting…"
                  : !allPicked
                    ? `Rank ${redraftablePool.length - ranked.length} More Chef${
                        redraftablePool.length - ranked.length === 1 ? "" : "s"
                      }`
                    : "Lock In Redraft"}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
