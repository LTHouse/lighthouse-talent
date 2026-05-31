"use client";

import { useMemo, useState } from "react";
import { Zap, FileText, BookOpenCheck, ExternalLink, Download } from "lucide-react";
import { Card, Tag, Button } from "@/components/ui";
import type { Resource } from "@/lib/data/resources";

interface ResourcesViewProps {
  resources: Resource[];
}

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

const UNCATEGORIZED = "Other";

// A resource backed by an uploaded file (vs. an external link) gets the
// download affordance; otherwise we open the external URL in a new tab.
function isDownload(r: Resource): boolean {
  return r.type === "download" || (!r.externalUrl && r.storagePath != null);
}

export default function ResourcesView({ resources }: ResourcesViewProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const categories = useMemo<CategoryGroup[]>(() => {
    const grouped: Record<string, Resource[]> = {};
    resources.forEach((r) => {
      const name = r.category ?? UNCATEGORIZED;
      const list = grouped[name] ?? (grouped[name] = []);
      list.push(r);
    });
    return Object.entries(grouped).map(([name, items]) => ({ name, items }));
  }, [resources]);

  const active = activeId != null ? resources.find((r) => r.id === activeId) ?? null : null;

  if (active) {
    const download = isDownload(active);
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <button onClick={() => setActiveId(null)} className="text-sm text-stone-500 hover:text-black">← Back to {active.category ?? UNCATEGORIZED}</button>
        <Card className="!p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">
            <Tag color="yellow">{active.category ?? UNCATEGORIZED}</Tag>
            {active.type && (<><span>·</span><span>{active.type}</span></>)}
          </div>
          <h1 className="font-display text-4xl mb-3">{active.title}</h1>
          {active.description && <p className="text-lg text-stone-700 mb-6">{active.description}</p>}
          <a href={active.href ?? "#"} target="_blank" rel="noreferrer">
            <Button icon={download ? Download : ExternalLink} disabled={!active.href}>
              {download ? "Download" : "Open"}
            </Button>
          </a>
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
          {items.map((r) => {
            const download = isDownload(r);
            return (
              <Card key={r.id} onClick={() => setActiveId(r.id)} className="hover:border-amber-400">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${download ? "bg-violet-100 text-violet-700" : "bg-yellow-100 text-amber-700"}`}>
                    {download ? <FileText size={18} /> : <BookOpenCheck size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-snug">{r.title}</div>
                    {r.description && <div className="text-xs text-stone-500 mt-1 line-clamp-2">{r.description}</div>}
                  </div>
                </div>
              </Card>
            );
          })}
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
      {categories.length === 0 ? (
        <Card className="!p-8 text-center text-stone-500">No resources yet.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Card key={c.name} onClick={() => setCategory(c.name)} className="hover:border-amber-400 !p-6">
              <div className="text-4xl mb-3 font-display">{CATEGORY_META[c.name]?.icon ?? "📚"}</div>
              <div className="font-display text-xl">{c.name}</div>
              {CATEGORY_META[c.name]?.desc && <div className="text-sm text-stone-500 mt-1">{CATEGORY_META[c.name]?.desc}</div>}
              <div className="text-xs text-stone-700 mt-3 font-bold">{c.items.length} {c.items.length === 1 ? "item" : "items"}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
