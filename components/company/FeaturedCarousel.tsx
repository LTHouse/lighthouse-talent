"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Candidate } from "@/lib/data/candidates";
import type { FeaturedItem } from "./types";
import FeaturedPreviewCard, { type FeaturedBadge } from "./FeaturedPreviewCard";

interface FeaturedCarouselProps {
  allFeatures: FeaturedItem[];
  currentWeekStart: string;
  candidates: Candidate[];
  onOpenCandidate: (id: string) => void;
}

function monthYearLabel(weekStartingISO: string): string {
  const d = new Date(weekStartingISO);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear() % 100).padStart(2, "0");
  return `${mm}/${yy}`;
}

export default function FeaturedCarousel({ allFeatures, currentWeekStart, candidates, onOpenCandidate }: FeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [allFeatures.length]);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button onClick={() => scrollBy(-280)}
          aria-label="Scroll featured left"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-stone-300 shadow-sm items-center justify-center hover:bg-stone-50">
          <ChevronLeft size={16} />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scrollBy(280)}
          aria-label="Scroll featured right"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-stone-300 shadow-sm items-center justify-center hover:bg-stone-50">
          <ChevronRight size={16} />
        </button>
      )}
      <div ref={scrollerRef} className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-1 px-1 scroll-smooth">
        {allFeatures.map((f) => {
          const c = candidates.find((cand) => cand.id === f.candidateId);
          if (!c) return null;
          const badge: FeaturedBadge = f.weekStarting === currentWeekStart
            ? { label: "NEW", className: "bg-amber-500 text-white" }
            : { label: monthYearLabel(f.weekStarting), className: "bg-stone-100 text-stone-600 border border-stone-200" };
          return <FeaturedPreviewCard key={f.candidateId} candidate={c} note={f.curatorNote} badge={badge} onOpen={() => onOpenCandidate(c.id)} />;
        })}
      </div>
    </div>
  );
}
