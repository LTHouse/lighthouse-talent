// Company portal — server component. Gated on the company role. Lists the
// network (RLS hides demo data). Full search/intro UX is the #16/#17 port; this
// is the typed, working shell on the established pattern.
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import CandidateTable from "@/components/CandidateTable";
import SignOutButton from "@/components/SignOutButton";

export default async function CompanyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "company") redirect("/");

  const candidates = await listCandidates("company");

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display font-bold tracking-tight">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Hire</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">Browse the network</h1>
        <CandidateTable candidates={candidates} />
      </main>
    </div>
  );
}
