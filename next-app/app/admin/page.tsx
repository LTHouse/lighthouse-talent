// Admin portal — server component. Gated on the admin role; loads candidates and
// intro requests live from Supabase (server-side) and hands them to the client
// shell, which owns the tabbed views, optimistic edits, and drill-ins.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";
import { listIntroRequests } from "@/lib/data/intros";
import AdminPortalClient from "@/components/admin/AdminPortalClient";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/");

  const [candidates, intros] = await Promise.all([
    listCandidates("admin"),
    listIntroRequests(),
  ]);

  return <AdminPortalClient candidates={candidates} intros={intros} adminName={user.name} />;
}
