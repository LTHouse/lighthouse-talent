// Talent portal — server component, gated on the talent role. The talent's whole
// signed-in experience is viewing + editing their own profile (by design they see
// nothing else). RLS scopes the row to their user_id.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Zap } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import SignOutButton from "@/components/SignOutButton";
import TalentProfileEditor from "@/components/talent/TalentProfileEditor";

export default async function TalentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "talent") redirect("/");

  const mine = await listCandidates("talent", user.id);
  const me = mine[0] ?? null;

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display font-bold tracking-tight">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Talent</span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        {me ? (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold">Your profile, {me.firstName || user.name}</h1>
              <p className="text-stone-500 text-sm mt-1">
                Keep this current — it&apos;s what Lighthouse uses to match you. You can update it anytime.
              </p>
            </div>
            <TalentProfileEditor candidate={me} />
          </>
        ) : (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-bold">Welcome, {user.name}</h1>
            <p className="text-stone-600 text-sm">
              We couldn&apos;t find your application yet. Complete it to join the talent network.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm bg-yellow-400 text-black hover:bg-yellow-300 font-bold transition-colors"
            >
              Start your application <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
