// Admin portal — server component. Gated on the admin role; lists candidates from
// Supabase (live, server-side). The proof that the Next + TS + SSR-auth + typed
// data-layer architecture works end to end.
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import CandidateTable from "@/components/CandidateTable";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/");

  const candidates = await listCandidates("admin");

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display font-bold tracking-tight">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-bold">Candidate database</h1>
          <span className="text-sm text-stone-500 tabular-nums">{candidates.length} candidates</span>
        </div>
        <CandidateTable candidates={candidates} />
      </main>
    </div>
  );
}
