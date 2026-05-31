"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FeaturedEntry } from "./types";
import FeaturedPreviewCard, { type FeaturedBadge } from "./FeaturedPreviewCard";

interface FeaturedCarouselProps {
  entries: FeaturedEntry[];
  onOpenCandidate: (id: string) => void;
}

const NEW_BADGE: FeaturedBadge = { label: "NEW", className: "bg-amber-500 text-white" };

export default function FeaturedCarousel({ entries, onOpenCandidate }: FeaturedCarouselProps) {
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
  }, [entries.length]);

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
        {entries.map((e) => (
          <FeaturedPreviewCard
            key={e.candidate.id}
            candidate={e.candidate}
            note={e.curatorNote ?? undefined}
            badge={NEW_BADGE}
            onOpen={() => onOpenCandidate(e.candidate.id)}
          />
        ))}
      </div>
    </div>
  );
}
