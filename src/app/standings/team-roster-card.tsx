"use client";

import { useState } from "react";
import { ChefScore, type EpisodeBreakdown } from "./chef-score";
import type { ChefStatus } from "@/lib/scoring";

export interface TeamCardChef {
  chefId: string;
  chefName: string;
  status: ChefStatus;
  points: number;
  episodes: EpisodeBreakdown[];
  kept?: boolean;
}

export interface TeamCardProps {
  teamName: string;
  ownerName: string;
  totalPoints: number;
  originalChefs: TeamCardChef[];
  originalSubtotal: number;
  redraftChefs: TeamCardChef[] | null;
  redraftSubtotal: number;
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

export function TeamRosterCard(props: TeamCardProps) {
  const hasRedraft = props.redraftChefs !== null;
  const [view, setView] = useState<"redraft" | "original">(
    hasRedraft ? "redraft" : "original"
  );

  const chefs = view === "redraft" && hasRedraft
    ? props.redraftChefs!
    : props.originalChefs;
  const subtotal =
    view === "redraft" ? props.redraftSubtotal : props.originalSubtotal;
  const subtotalLabel =
    view === "redraft" ? "Ep 9+ subtotal" : "Ep 1–8 total (locked)";

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-lg shadow-black/[0.06] overflow-hidden">
      <div className="relative border-b border-border/50 bg-gradient-to-b from-mustard/[0.06] to-transparent px-5 py-3">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mustard/60 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-foreground truncate">
              {props.teamName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {props.ownerName} &middot;{" "}
              <span className="font-bold text-foreground font-mono">
                {props.totalPoints.toFixed(1)} pts
              </span>
            </p>
          </div>
          {hasRedraft && (
            <div className="shrink-0 inline-flex rounded-md border border-border/60 bg-muted/40 p-0.5 text-[11px] font-semibold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setView("redraft")}
                className={`rounded-sm px-2 py-1 transition-colors ${
                  view === "redraft"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Redraft
              </button>
              <button
                type="button"
                onClick={() => setView("original")}
                className={`rounded-sm px-2 py-1 transition-colors ${
                  view === "original"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Original
              </button>
            </div>
          )}
        </div>
      </div>
      <ul className="divide-y divide-border/40 px-5">
        {chefs.map((chef) => (
          <li
            key={chef.chefId}
            className="flex items-center justify-between py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-foreground">
                {chef.chefName}
              </span>
              <StatusBadge status={chef.status} />
              {chef.kept && (
                <span className="inline-flex items-center rounded-full bg-mustard/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mustard-dark">
                  Kept
                </span>
              )}
            </div>
            <ChefScore points={chef.points} episodes={chef.episodes} />
          </li>
        ))}
      </ul>
      {hasRedraft && (
        <div className="border-t border-border/40 px-5 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>{subtotalLabel}</span>
          <span className="font-mono font-bold text-foreground">
            {subtotal.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
