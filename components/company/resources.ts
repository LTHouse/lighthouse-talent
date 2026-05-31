// Static resource library content, ported from the Vite app's RESOURCES array.
// This is editorial content (playbooks, templates, market data) — not candidate
// data — so it's safe to ship as a constant. Real content lands later (#18).
import type { Resource } from "./types";

export const RESOURCES: Resource[] = [
  { id: 1, category: "Hiring Playbooks", type: "article", title: "How to Write a JD That Actually Filters", desc: "A 1-page framework for writing job descriptions that attract the right candidates and repel the wrong ones.", views: 421, updatedAt: "2026-04-22" },
  { id: 2, category: "Hiring Playbooks", type: "article", title: "The Founder's Guide to Making Your First 5 Hires", desc: "Sequencing matters. The wrong order will set your team back 6 months.", views: 612, updatedAt: "2026-04-15" },
  { id: 3, category: "Hiring Playbooks", type: "article", title: "Interview Rubrics That Catch Bad Fits", desc: "Concrete rubrics across IC, manager, and exec interviews. Stop hiring for vibes.", views: 287, updatedAt: "2026-04-10" },
  { id: 4, category: "Hiring Playbooks", type: "article", title: "How to Evaluate Culture Fit Without Bias", desc: "Culture fit gets a bad rap because it's often a proxy for sameness. How to assess it without falling into that trap.", views: 341, updatedAt: "2026-03-28" },
  { id: 5, category: "Hiring Playbooks", type: "article", title: "When to Fire Fast (And When to Coach)", desc: "The 30/60/90 framework for knowing whether someone needs more time or needs to leave.", views: 522, updatedAt: "2026-03-20" },
  { id: 6, category: "Role Profiles", type: "article", title: "The Founding Engineer Role: What to Look For", desc: "What makes a great founding engineer, common failure modes, and what to pay.", views: 487, updatedAt: "2026-04-25" },
  { id: 7, category: "Role Profiles", type: "article", title: "Hiring Your First Chief of Staff", desc: "The Chief of Staff role is widely misunderstood. The playbook for getting it right.", views: 376, updatedAt: "2026-04-18" },
  { id: 8, category: "Role Profiles", type: "article", title: "Head of Operations vs Chief of Staff", desc: "They sound similar. They're not. The distinction and when to hire which.", views: 298, updatedAt: "2026-04-12" },
  { id: 9, category: "Role Profiles", type: "article", title: "What a Great Founding Designer Looks Like", desc: "Design is foundational, not decorative. What to look for in design hire #1.", views: 243, updatedAt: "2026-04-05" },
  { id: 10, category: "Role Profiles", type: "article", title: "First Marketing Hire: Ops vs. Brand vs. Growth", desc: "Three different first marketers. Three different outcomes. How to pick.", views: 312, updatedAt: "2026-03-30" },
  { id: 11, category: "Role Profiles", type: "article", title: "Hiring a Functional Lead at Series A", desc: "What changes about hiring functional leads (Marketing, Sales, CS) at Series A vs. Seed.", views: 221, updatedAt: "2026-03-12" },
  { id: 12, category: "Market Data", type: "article", title: "Nashville Startup Salaries by Role — Q2 2026", desc: "Live benchmarks for Engineering, Product, Design, Ops, Marketing, Sales across stages.", views: 892, updatedAt: "2026-05-01" },
  { id: 13, category: "Market Data", type: "article", title: "Equity Ranges by Stage: Pre-seed to Series B", desc: "Standard equity bands for first 5, 10, 25, and 50 hires by stage.", views: 634, updatedAt: "2026-04-28" },
  { id: 14, category: "Market Data", type: "article", title: "Signing Bonus Norms in Nashville", desc: "When to offer a signing bonus, how big, and what it should be tied to.", views: 287, updatedAt: "2026-04-20" },
  { id: 15, category: "Market Data", type: "article", title: "Remote vs In-Person Comp Deltas — 2026", desc: "How remote-only hires are paid relative to Nashville-local hires. Updated quarterly.", views: 401, updatedAt: "2026-04-18" },
  { id: 16, category: "Templates", type: "download", title: "JD: Founding Engineer", desc: "A battle-tested JD template for hiring your founding engineer.", views: 234, updatedAt: "2026-04-25", fileType: "DOCX, 2 pages" },
  { id: 17, category: "Templates", type: "download", title: "JD: Chief of Staff", desc: "For Series A founders hiring their Chief of Staff. Includes scope and outcomes.", views: 198, updatedAt: "2026-04-22", fileType: "DOCX, 2 pages" },
  { id: 18, category: "Templates", type: "download", title: "JD: First Marketing Hire", desc: "For B2B SaaS at Seed/Series A. Three flavors: brand, growth, ops.", views: 189, updatedAt: "2026-04-18", fileType: "DOCX, 3 pages" },
  { id: 19, category: "Templates", type: "download", title: "Offer Letter: Series A", desc: "Standard Series A offer letter with comp + equity + refresh grants.", views: 256, updatedAt: "2026-04-08", fileType: "DOCX, 3 pages" },
  { id: 20, category: "Templates", type: "download", title: "Interview Rubric: Engineering", desc: "5-point rubric across system design, coding, technical leadership, debugging, mentorship.", views: 312, updatedAt: "2026-04-02", fileType: "PDF, 4 pages" },
  { id: 21, category: "Templates", type: "download", title: "Reference Check Questions: Senior", desc: "For Senior+ roles. Leadership, conflict, decision-making questions.", views: 201, updatedAt: "2026-03-22", fileType: "PDF, 3 pages" },
  { id: 22, category: "Lighthouse Insights", type: "article", title: "Zap on Why Most First Hires Fail", desc: "From the Founders Only podcast — Zap's take on the #1 reason founder hires don't work out.", views: 723, updatedAt: "2026-04-30" },
  { id: 23, category: "Lighthouse Insights", type: "article", title: "The Nashville Hiring Advantage", desc: "Why coastal VCs underestimate Nashville talent — and how it shows up in retention numbers.", views: 511, updatedAt: "2026-04-22" },
  { id: 24, category: "Lighthouse Insights", type: "article", title: "Why We Built the Lighthouse Talent Network", desc: "The story behind Lighthouse Talent — and the future of curated talent.", views: 256, updatedAt: "2026-03-30" },
];

// Short labels for a candidate's top motivation, used on the featured cards.
export const MOTIVATION_SHORT: Record<string, string> = {
  "I want to own something — equity, decisions, outcomes.": "Wants ownership",
  "I want to learn faster than I would anywhere else.": "Wants to learn faster",
  "I want to find a startup where I care deeply about the specific problem being solved.": "Mission-driven",
  "I want to build something from scratch, not maintain what already exists.": "Wants to build 0→1",
  "I'm bored at big company life and I'm finally doing something about it.": "Escaping big-co",
  "I want the financial upside if the company wins big.": "Upside-driven",
  "I just need a job.": "Just needs a job",
};
