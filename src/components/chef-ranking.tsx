"use client";

import { useId } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChefItem } from "./chef-item";
import type { Chef } from "@/lib/chefs";

interface ChefRankingProps {
  ranked: Chef[];
  unranked: Chef[];
  onReorder: (chefs: Chef[]) => void;
  onPick: (chef: Chef) => void;
  onRemove: (chef: Chef) => void;
}

export function ChefRanking({ ranked, unranked, onReorder, onPick, onRemove }: ChefRankingProps) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ranked.findIndex((c) => c.id === active.id);
      const newIndex = ranked.findIndex((c) => c.id === over.id);
      onReorder(arrayMove(ranked, oldIndex, newIndex));
    }
  }

  return (
    <div className="space-y-6">
      {/* Available chefs pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground tracking-tight">
            Available Chefs
          </h3>
          {unranked.length > 0 && (
            <p className="text-sm text-muted-foreground/70">
              Click to add to your rankings
            </p>
          )}
        </div>

        {unranked.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unranked.map((chef) => (
              <button
                key={chef.id}
                type="button"
                onClick={() => onPick(chef)}
                className="rounded-lg border border-border/50 bg-muted/60 px-3 py-2 text-base font-medium text-foreground/80 transition-all duration-150 hover:border-mustard/40 hover:bg-mustard/[0.06] hover:text-foreground active:scale-[0.97]"
              >
                {chef.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-mustard/25 bg-mustard/[0.04] px-4 py-3 text-center text-sm text-mustard-dark/60">
            All chefs ranked — drag below to fine-tune order
          </p>
        )}
      </div>

      {/* Divider with reset */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
          Your Draft Order
        </span>
        <div className="h-px flex-1 bg-border/50" />
        {ranked.length > 0 && (
          <button
            type="button"
            onClick={() => onReorder([])}
            className="rounded-md border border-border/60 bg-muted/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {/* Ranked list with drag-and-drop */}
      <div className="space-y-3">
        {ranked.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
            <p className="text-base text-muted-foreground/60">
              Click a chef above to start building your rankings
            </p>
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ranked.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {ranked.map((chef, index) => (
                  <ChefItem
                    key={chef.id}
                    chef={chef}
                    rank={index + 1}
                    onRemove={() => onRemove(chef)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
