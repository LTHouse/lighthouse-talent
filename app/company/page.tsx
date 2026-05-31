// Company portal — server component. Gated on the company role. Fetches the
// live network (RLS + the query hide demo/non-active rows) plus the company's
// saved searches, shortlists, current featured week, and review queue, then
// hands it all to the client portal which owns the search/intro UX. Writes go
// through Server Actions; the client calls router.refresh() to pull fresh data.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import { listSavedSearches, listShortlists } from "@/lib/data/workspace";
import { getCurrentFeatured } from "@/lib/data/featured";
import { listSentForReview } from "@/lib/data/sentForReview";
import CompanyPortalClient from "@/components/company/CompanyPortalClient";

export default async function CompanyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "company") redirect("/");

  const [candidates, savedSearches, shortlists, featured, reviewQueue] = await Promise.all([
    listCandidates("company"),
    listSavedSearches(),
    listShortlists(),
    getCurrentFeatured(),
    listSentForReview(),
  ]);

  return (
    <CompanyPortalClient
      candidates={candidates}
      companyName={user.name}
      savedSearches={savedSearches}
      shortlists={shortlists}
      featured={featured}
      reviewQueue={reviewQueue}
    />
  );
}
