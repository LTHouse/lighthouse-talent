// Company portal — server component. Gated on the company role. Fetches the
// live network (RLS + the query hide demo/non-active rows) and hands it to the
// client portal which owns all the search/intro UX. Ported from the Vite app's
// CompanyPortal (#16/#17).
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import CompanyPortalClient from "@/components/company/CompanyPortalClient";

export default async function CompanyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "company") redirect("/");

  const candidates = await listCandidates("company");

  return <CompanyPortalClient candidates={candidates} companyName={user.name} />;
}
