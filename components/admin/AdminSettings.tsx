"use client";

// Admin settings. The outbound-email master toggle is rendered READ-ONLY: it is
// managed in platform_settings (see lib/data/settings.ts) and ships DISABLED.
// TODO(#17): wire a server action to flip platform_settings.outbound_emails.
// The Vite window-global approver-role + outbound toggles are intentionally dropped.
import { Mail } from "lucide-react";
import { Card, Tag } from "@/components/ui";

export default function AdminSettings() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-3xl">Settings</h2>
      <Card className="border-rose-300 bg-rose-50/40">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-2" style={{ color: "#be123c" }}>
              <Mail size={12} /> Outbound emails master toggle
            </div>
            <div className="text-sm text-stone-700">
              All outbound emails DISABLED. MVP launches in this state. Intro emails queue but don&apos;t fire.
            </div>
            <div className="text-[11px] text-stone-500 mt-1.5">
              Managed in <code className="font-mono">platform_settings.outbound_emails</code>. Read-only here — flipping it is a follow-up (#17).
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button disabled className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-black text-yellow-300 border-black opacity-60 cursor-not-allowed">DISABLED</button>
            <button disabled className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-white border-stone-300 opacity-40 cursor-not-allowed">ENABLED</button>
          </div>
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Intro request approver role</div>
        <div className="text-sm text-stone-700">Zap only (MVP default).</div>
        <div className="text-xs text-stone-500 mt-1.5">Approver permissions are enforced by RLS. Expanding the approver set is a follow-up (#17).</div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">User management</div>
        <div className="space-y-1.5 text-sm">
          {[
            { email: "zap@lt.house", role: "Admin (approver)" },
            { email: "mike@lt.house", role: "Admin" },
          ].map((u) => (
            <div key={u.email} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg">
              <span className="font-mono text-xs">{u.email}</span>
              <Tag size="sm">{u.role}</Tag>
            </div>
          ))}
        </div>
        <div className="text-xs text-stone-500 mt-2">Read-only. User provisioning lives in <code className="font-mono">public.users</code>.</div>
      </Card>
    </div>
  );
}
