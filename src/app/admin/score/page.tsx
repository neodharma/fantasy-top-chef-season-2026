"use client";

import { useState } from "react";
import { chefs } from "@/lib/chefs";
import { POINT_VALUES, type EventType } from "@/lib/scoring";
import { submitEpisodeScores } from "@/lib/actions";

const ALL_EVENTS: { event: EventType; label: string; group: string }[] = [
  { event: "quickfire_win", label: "QF Win", group: "Quickfire" },
  { event: "quickfire_top", label: "QF Top", group: "Quickfire" },
  { event: "quickfire_bottom", label: "QF Bottom", group: "Quickfire" },
  { event: "elimination_win", label: "Elim Win", group: "Elimination" },
  { event: "elimination_top", label: "Elim Top", group: "Elimination" },
  { event: "elimination_bottom", label: "Elim Bottom", group: "Elimination" },
  { event: "lck_win", label: "LCK Win", group: "LCK" },
  { event: "sent_to_lck", label: "Sent to LCK", group: "Status" },
  { event: "eliminated", label: "Eliminated", group: "Status" },
  { event: "bonus_risotto", label: "Risotto", group: "Bonus" },
  { event: "bonus_cries", label: "Cries", group: "Bonus" },
  { event: "bonus_incomplete_plate", label: "Incomplete Plate", group: "Bonus" },
  { event: "bonus_forgot_ingredient", label: "Forgot Ingredient", group: "Bonus" },
  { event: "bonus_liquid_nitrogen", label: "Liquid Nitrogen", group: "Bonus" },
];

type CheckState = Record<string, Record<EventType, boolean>>;

function buildInitialState(): CheckState {
  const state: CheckState = {};
  for (const chef of chefs) {
    state[chef.id] = {} as Record<EventType, boolean>;
    for (const { event } of ALL_EVENTS) {
      state[chef.id][event] = false;
    }
  }
  return state;
}

export default function AdminScorePage() {
  const [episode, setEpisode] = useState(1);
  const [checks, setChecks] = useState<CheckState>(buildInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function toggle(chefId: string, event: EventType) {
    setChecks((prev) => ({
      ...prev,
      [chefId]: { ...prev[chefId], [event]: !prev[chefId][event] },
    }));
  }

  function clearAll() {
    setChecks(buildInitialState());
    setResult(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    const entries: { chef_id: string; event: string }[] = [];
    for (const chef of chefs) {
      for (const { event } of ALL_EVENTS) {
        if (checks[chef.id][event]) {
          entries.push({ chef_id: chef.id, event });
        }
      }
    }

    if (entries.length === 0) {
      setResult({ type: "error", message: "No events checked." });
      setSubmitting(false);
      return;
    }

    const res = await submitEpisodeScores(episode, entries);
    setSubmitting(false);

    if (res.success) {
      setResult({
        type: "success",
        message: `Saved ${res.inserted} event(s) for Episode ${episode}.`,
      });
    } else {
      setResult({ type: "error", message: res.error ?? "Unknown error." });
    }
  }

  // Group events by category for column headers
  const groups = [...new Map(ALL_EVENTS.map((e) => [e.group, e.group])).values()];

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Score Episode
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check all events that apply for each chef, then submit.
        </p>
      </div>

      {/* Episode selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">
          Episode
        </label>
        <input
          type="number"
          min={1}
          value={episode}
          onChange={(e) => setEpisode(Number(e.target.value))}
          className="w-20 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground tabular-nums focus:border-mustard/40 focus:ring-mustard/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={clearAll}
          className="rounded-md border border-border/60 bg-muted/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive transition-all"
        >
          Clear All
        </button>
      </div>

      {/* Scoring grid */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06]">
        <table className="w-full text-sm">
          <thead>
            {/* Group header row */}
            <tr className="border-b border-border/50 bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/40 py-2 pl-4 pr-3 text-left font-semibold text-muted-foreground" />
              {groups.map((group) => {
                const count = ALL_EVENTS.filter((e) => e.group === group).length;
                return (
                  <th
                    key={group}
                    colSpan={count}
                    className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider text-mustard-dark/70 border-l border-border/30"
                  >
                    {group}
                  </th>
                );
              })}
            </tr>
            {/* Event label row */}
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="sticky left-0 z-10 bg-muted/20 py-2 pl-4 pr-3 text-left text-xs font-semibold text-muted-foreground">
                Chef
              </th>
              {ALL_EVENTS.map((e, i) => {
                const isGroupStart =
                  i === 0 || ALL_EVENTS[i - 1].group !== e.group;
                const pts = POINT_VALUES[e.event];
                const ptsStr =
                  pts === 0 ? "" : pts > 0 ? `+${pts}` : `${pts}`;
                return (
                  <th
                    key={e.event}
                    className={`py-2 px-1 text-center text-[10px] leading-tight font-medium text-muted-foreground whitespace-nowrap ${isGroupStart ? "border-l border-border/30" : ""}`}
                  >
                    <div>{e.label}</div>
                    {ptsStr && (
                      <div className="text-[9px] opacity-60">{ptsStr}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {chefs.map((chef, ci) => (
              <tr
                key={chef.id}
                className={ci % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="sticky left-0 z-10 bg-inherit py-2 pl-4 pr-3 font-medium text-foreground whitespace-nowrap">
                  {chef.name}
                </td>
                {ALL_EVENTS.map((e, i) => {
                  const isGroupStart =
                    i === 0 || ALL_EVENTS[i - 1].group !== e.group;
                  const checked = checks[chef.id][e.event];
                  return (
                    <td
                      key={e.event}
                      className={`py-2 px-1 text-center ${isGroupStart ? "border-l border-border/30" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(chef.id, e.event)}
                        className="h-5 w-5 cursor-pointer accent-mustard-dark"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary & submit */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-mustard-dark px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-mustard hover:shadow-md disabled:opacity-50"
        >
          {submitting ? "Submitting..." : `Submit Episode ${episode}`}
        </button>

        {result && (
          <p
            className={`text-sm font-medium ${
              result.type === "success"
                ? "text-green-700"
                : "text-destructive"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground/50">
        Warning: submitting will replace all existing data for this episode.
      </p>
    </main>
  );
}
