"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefRanking } from "./chef-ranking";
import { Confirmation } from "./confirmation";
import { chefs as allChefs, type Chef } from "@/lib/chefs";
import { submitDraft } from "@/lib/actions";

export function DraftForm() {
  const [teamName, setTeamName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ranked, setRanked] = useState<Chef[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unranked = allChefs.filter(
    (c) => !ranked.some((r) => r.id === c.id)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await submitDraft(teamName, ownerName, ranked);

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  function handleReset() {
    setTeamName("");
    setOwnerName("");
    setRanked([]);
    setSubmitted(false);
    setError(null);
  }

  function handlePick(chef: Chef) {
    setRanked((prev) => [...prev, chef]);
  }

  function handleRemove(chef: Chef) {
    setRanked((prev) => prev.filter((c) => c.id !== chef.id));
  }

  if (submitted) {
    return (
      <Confirmation
        ownerName={ownerName}
        rankings={ranked}
        onReset={handleReset}
      />
    );
  }

  const allPicked = ranked.length === allChefs.length;

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden">
      {/* Card header with warm accent bar */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-6 py-5 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Submit Your Draft Preferences
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          Enter your details and rank the chefs below
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mise en Place Masters"
                required
                className="bg-background/50 border-border/60 focus:border-mustard/40 focus:ring-mustard/20 placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Owner Name
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Your name"
                required
                className="bg-background/50 border-border/60 focus:border-mustard/40 focus:ring-mustard/20 placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <ChefRanking
            ranked={ranked}
            unranked={unranked}
            onReorder={setRanked}
            onPick={handlePick}
            onRemove={handleRemove}
          />

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-mustard-dark hover:bg-mustard text-white font-bold tracking-wide py-3 h-12 text-base uppercase transition-all duration-200 hover:shadow-md"
            disabled={submitting || !teamName.trim() || !ownerName.trim() || !allPicked}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting...
              </span>
            ) : !allPicked ? (
              `Pick ${allChefs.length - ranked.length} More Chef${allChefs.length - ranked.length === 1 ? "" : "s"}`
            ) : (
              "Lock In Draft Preferences"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
