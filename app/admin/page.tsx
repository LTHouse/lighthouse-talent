// Admin portal — server component. Gated on the admin role; loads candidates,
// intro requests, companies, the current featured week, and the sent-for-review log
// live from Supabase (server-side) and hands them to the client shell, which owns
// the tabbed views, optimistic edits, and drill-ins. Writes go through server
// actions; the client calls router.refresh() to pull fresh server data.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import { listIntroRequests } from "@/lib/data/intros";
import { listCompanies } from "@/lib/data/companies";
import { getCurrentFeatured, isoWeekStart } from "@/lib/data/featured";
import { listSentForReview } from "@/lib/data/sentForReview";
import AdminPortalClient from "@/components/admin/AdminPortalClient";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/");

  const [candidates, intros, companies, featured, sentForReview] = await Promise.all([
    listCandidates("admin"),
    listIntroRequests(),
    listCompanies(),
    getCurrentFeatured(),
    listSentForReview(),
  ]);

  return (
    <AdminPortalClient
      candidates={candidates}
      intros={intros}
      companies={companies}
      featured={featured}
      currentWeek={isoWeekStart()}
      sentForReview={sentForReview}
      adminName={user.name}
    />
  );
}
