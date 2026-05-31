// Admin settings. v1 sends no outbound email (intros are done by hand), so there's
// no email toggle here. User provisioning lives in public.users (see scripts/).
import { Card, Tag } from "@/components/ui";

export default function AdminSettings() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-3xl">Settings</h2>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Intros</div>
        <div className="text-sm text-stone-700">
          Intro requests appear in the <strong>Intro Requests</strong> tab. Zap reviews each one and makes the
          connection personally — there is no automated email in this version.
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Access</div>
        <div className="text-sm text-stone-700">
          Roles are enforced by RLS via <code className="font-mono">public.users</code>. Provisioning a new
          admin / company / talent login is a reviewed script step (see <code className="font-mono">scripts/</code>).
        </div>
        <div className="mt-2 flex gap-1.5"><Tag size="sm">admin</Tag> <Tag size="sm">company</Tag> <Tag size="sm">talent</Tag></div>
      </Card>
    </div>
  );
}
