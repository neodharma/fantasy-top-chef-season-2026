"use client";

import { useRef, useState } from "react";

export interface EpisodeBreakdown {
  episode: number;
  events: { label: string; points: number }[];
  total: number;
}

interface Props {
  points: number;
  episodes: EpisodeBreakdown[];
}

export function ChefScore({ points, episodes }: Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

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

  const hasData = episodes.length > 0;

  return (
    <>
      <span
        ref={ref}
        className={`text-sm font-semibold text-foreground tabular-nums ${hasData ? "cursor-default underline decoration-dotted decoration-muted-foreground/40 underline-offset-2" : ""}`}
        onMouseEnter={hasData ? handleEnter : undefined}
        onMouseLeave={() => setShow(false)}
      >
        {points}
      </span>

      {show && (
        <div
          className="fixed z-50 w-52 rounded-lg border border-border/60 bg-card shadow-xl shadow-black/10 p-3 text-left"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-border/60" />
          <div className="space-y-2">
            {episodes.map((ep) => (
              <div key={ep.episode}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Episode {ep.episode}
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      ep.total > 0
                        ? "text-green-700"
                        : ep.total < 0
                          ? "text-red-700"
                          : "text-muted-foreground"
                    }`}
                  >
                    {ep.total > 0 ? "+" : ""}
                    {ep.total}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ep.events.map((evt, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-tight font-medium ${
                        evt.points > 0
                          ? "bg-green-50 text-green-700"
                          : evt.points < 0
                            ? "bg-red-50 text-red-700"
                            : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {evt.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
