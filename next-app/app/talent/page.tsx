// Talent portal — server component. Gated on the talent role; shows the signed-in
// candidate their own profile row (RLS scopes to their user_id). The full intake/
// edit UX is the #15/#22 port; this is the typed shell on the established pattern.
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import SignOutButton from "@/components/SignOutButton";

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
        <h1 className="font-display text-2xl font-bold mb-2">Welcome, {user.name}</h1>
        {me ? (
          <p className="text-stone-600 text-sm">
            Your application status: <span className="font-semibold">{me.vettingStatus}</span>.
          </p>
        ) : (
          <p className="text-stone-600 text-sm">
            Your profile isn&apos;t set up yet — the application flow is coming soon.
          </p>
        )}
      </main>
    </div>
  );
}
