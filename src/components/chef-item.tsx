"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { Chef } from "@/lib/chefs";

interface ChefItemProps {
  chef: Chef;
  rank: number;
  onRemove: () => void;
}

export function ChefItem({ chef, rank, onRemove }: ChefItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: chef.id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const isTop3 = rank <= 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
        isDragging
          ? "z-50 shadow-lg shadow-mustard/10 border-mustard/30 bg-card scale-[1.02]"
          : "bg-card/60 border-border/40 hover:border-border hover:bg-card hover:shadow-sm"
      }`}
    >
      {/* Rank medallion */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${
          isTop3
            ? "bg-mustard/15 text-mustard-dark border border-mustard/25"
            : "bg-muted/60 text-muted-foreground border border-transparent"
        }`}
      >
        {rank}
      </div>

      {/* Drag handle */}
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Chef name */}
      <span className={`flex-1 text-base transition-colors duration-200 ${
        isTop3 ? "font-semibold text-foreground" : "font-medium text-foreground/80"
      }`}>
        {chef.name}
      </span>

      {/* Top 3 indicator */}
      {isTop3 && (
        <span className="text-xs font-semibold uppercase tracking-wider text-mustard-dark/50 hidden sm:block">
          {rank === 1 ? "1st Pick" : rank === 2 ? "2nd Pick" : "3rd Pick"}
        </span>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground/30 hover:text-destructive transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
