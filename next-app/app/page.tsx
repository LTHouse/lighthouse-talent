// Home — server component. Provisioned users are routed to their portal; everyone
// else sees the landing + login. (Auth role comes from public.users, never defaulted.)
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";

const HOME_FOR: Record<string, string> = {
  admin: "/admin",
  company: "/company",
  talent: "/talent",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    const dest = HOME_FOR[user.role];
    if (dest) redirect(dest);
  }
  const { auth_error } = await searchParams;
  return <LoginScreen authError={!!auth_error} />;
}
