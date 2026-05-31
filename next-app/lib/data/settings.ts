// Platform settings — the master outbound-email toggle (ships disabled). Every
// email trigger must check this before sending (#17).
import { createClient } from "@/lib/supabase/server";

export async function outboundEmailsEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "outbound_emails")
    .maybeSingle();
  const value = data?.value as { enabled?: boolean } | null;
  return value?.enabled === true;
}
