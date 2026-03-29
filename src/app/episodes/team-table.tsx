"use client";

import { useRef, useState } from "react";

interface ChefBreakdown {
  name: string;
  events: string[];
  points: number;
}

interface EpCell {
  totalPoints: number;
  chefs: ChefBreakdown[];
}

interface Props {
  rosters: { teamName: string; ownerName: string }[];
  episodes: number[];
  teamEpData: Record<string, Record<number, EpCell>>;
  teamTotals: Record<string, number>;
}

function PointsCell({ cell }: { cell: EpCell | undefined }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  if (!cell) {
    return (
      <td className="py-2 px-2 sm:py-2.5 sm:px-3 text-center text-muted-foreground/40 border-l border-border/30">
        &mdash;
      </td>
    );
  }

  const color =
    cell.totalPoints > 0
      ? "text-green-700"
      : cell.totalPoints < 0
        ? "text-red-700"
        : "text-foreground";

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
    setShow(true);
  };

  return (
    <td className="py-2 px-2 sm:py-2.5 sm:px-3 text-center border-l border-border/30">
      <span
        ref={ref}
        className={`font-bold font-mono cursor-default ${color}`}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        {cell.totalPoints > 0 ? "+" : ""}
        {cell.totalPoints.toFixed(1)}
      </span>

      {show && (
        <div
          className="fixed z-50 w-56 rounded-lg border border-border/60 bg-card shadow-xl shadow-black/10 p-3 text-left -translate-x-1/2"
          style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-border/60" />
          <div className="space-y-1.5">
            {cell.chefs.map((chef) => (
              <div key={chef.name}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {chef.name}
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      chef.points > 0
                        ? "text-green-700"
                        : chef.points < 0
                          ? "text-red-700"
                          : "text-muted-foreground"
                    }`}
                  >
                    {chef.points > 0 ? "+" : ""}
                    {chef.points}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {chef.events.map((evt, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-muted-foreground"
                    >
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </td>
  );
}

export function TeamTable({ rosters, episodes, teamEpData, teamTotals }: Props) {
  return (
    <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 overscroll-x-contain snap-x snap-proximity">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="py-1.5 pr-2 sm:py-2 sm:pr-3 text-center font-semibold text-muted-foreground sticky left-0 bg-card z-10">
              Team
            </th>
            {episodes.map((ep) => (
              <th
                key={ep}
                className="py-1.5 px-2 sm:py-2 sm:px-3 text-center font-semibold text-muted-foreground border-l border-border/30 snap-start"
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
          {rosters.map((roster, i) => (
            <tr
              key={roster.teamName}
              className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
            >
              <td className={`py-2 pr-2 sm:py-2.5 sm:pr-3 whitespace-nowrap sticky left-0 text-center ${i % 2 === 0 ? "bg-card" : "bg-secondary"}`}>
                <span className="font-bold text-foreground">
                  {roster.teamName}
                </span>
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  {roster.ownerName}
                </span>
              </td>
              {episodes.map((ep) => (
                <PointsCell
                  key={ep}
                  cell={teamEpData[roster.teamName]?.[ep]}
                />
              ))}
              <td className="py-2 pl-2 sm:py-2.5 sm:pl-3 text-center font-bold text-foreground font-mono border-l border-border/30">
                {(teamTotals[roster.teamName] ?? 0).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
