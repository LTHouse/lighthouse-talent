"use client";

import { useMemo, useState } from "react";
import { Zap, FileText, BookOpenCheck } from "lucide-react";
import { Card, Tag, Button } from "@/components/ui";
import { RESOURCES } from "./resources";
import type { Resource } from "./types";

interface CategoryGroup {
  name: string;
  items: Resource[];
}

const CATEGORY_META: Record<string, { icon: string; desc: string }> = {
  "Hiring Playbooks": { icon: "📋", desc: "How to hire well." },
  "Role Profiles": { icon: "🎯", desc: "Per-role deep dives." },
  "Market Data": { icon: "📊", desc: "Nashville comp benchmarks." },
  Templates: { icon: "📁", desc: "JDs, offer letters, rubrics." },
  "Lighthouse Insights": { icon: "⚡", desc: "Zap's perspective." },
};

export default function ResourcesView() {
  const [category, setCategory] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const categories = useMemo<CategoryGroup[]>(() => {
    const grouped: Record<string, Resource[]> = {};
    RESOURCES.forEach((r) => {
      const list = grouped[r.category] ?? (grouped[r.category] = []);
      list.push(r);
    });
    return Object.entries(grouped).map(([name, items]) => ({ name, items }));
  }, []);

  const active = activeId != null ? RESOURCES.find((r) => r.id === activeId) ?? null : null;

  if (active) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <button onClick={() => setActiveId(null)} className="text-sm text-stone-500 hover:text-black">← Back to {active.category}</button>
        <Card className="!p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">
            <Tag color="yellow">{active.category}</Tag>
            <span>·</span>
            <span>Updated {active.updatedAt}</span>
            <span>·</span>
            <span>{active.views} views</span>
          </div>
          <h1 className="font-display text-4xl mb-3">{active.title}</h1>
          <p className="text-lg text-stone-700 mb-6">{active.desc}</p>
          {active.type === "download" ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
              <FileText size={36} className="text-amber-500 mx-auto mb-3" />
              <div className="font-bold mb-1">{active.title}</div>
              <div className="text-sm text-stone-500 mb-4">{active.fileType}</div>
              <Button icon={FileText}>Download</Button>
            </div>
          ) : (
            <div className="prose prose-stone max-w-none text-stone-700 space-y-4 text-base leading-relaxed">
              <p>This is placeholder body content for &ldquo;{active.title}&rdquo;. Real content will be uploaded by Lighthouse staff — likely from existing Founders Only podcast transcripts, Zap&apos;s Wrap archives, and talks.</p>
              <h3 className="font-display text-2xl text-black mt-6">Key takeaways</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>The framing matters more than the framework.</li>
                <li>Sequencing the first 10 hires is the single highest-leverage decision a founder makes.</li>
                <li>Most &ldquo;culture fit&rdquo; problems are actually role-clarity problems.</li>
              </ul>
              <p>For v2, the structure, taxonomy, and surface area are the deliverables. The content layer fills in over time, possibly as a Capstone project deliverable.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (category) {
    const items = categories.find((c) => c.name === category)?.items ?? [];
    return (
      <div className="space-y-4">
        <button onClick={() => setCategory(null)} className="text-sm text-stone-500 hover:text-black">← All categories</button>
        <h2 className="font-display text-3xl">{category}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((r) => (
            <Card key={r.id} onClick={() => setActiveId(r.id)} className="hover:border-amber-400">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === "download" ? "bg-violet-100 text-violet-700" : "bg-yellow-100 text-amber-700"}`}>
                  {r.type === "download" ? <FileText size={18} /> : <BookOpenCheck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm leading-snug">{r.title}</div>
                  <div className="text-xs text-stone-500 mt-1 line-clamp-2">{r.desc}</div>
                  <div className="text-[10px] text-stone-500 mt-2">{r.views} views · {r.updatedAt}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl">Resources <Zap className="inline text-amber-500 fill-amber-500" size={24} /></h2>
        <p className="text-sm text-stone-500 mt-1">Hiring playbooks, role profiles, market data, and templates from the Lighthouse network.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => (
          <Card key={c.name} onClick={() => setCategory(c.name)} className="hover:border-amber-400 !p-6">
            <div className="text-4xl mb-3 font-display">{CATEGORY_META[c.name]?.icon ?? "📚"}</div>
            <div className="font-display text-xl">{c.name}</div>
            <div className="text-sm text-stone-500 mt-1">{CATEGORY_META[c.name]?.desc}</div>
            <div className="text-xs text-stone-700 mt-3 font-bold">{c.items.length} {c.items[0]?.type === "download" ? "downloads" : "articles"}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
