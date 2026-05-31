// Resource library data layer. Admin curates; any signed-in user reads published
// ones. A resource is either an external link or an uploaded file (Supabase
// Storage, private bucket `resources` → served via short-lived signed URLs).
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];

export interface Resource {
  id: string;
  title: string;
  category: string | null;
  type: string | null;
  description: string | null;
  externalUrl: string | null;
  storagePath: string | null;
  published: boolean;
  createdAt: string;
  href: string | null; // resolved link (external URL or signed download URL)
}

const BUCKET = "resources";

async function rowsToResources(rows: ResourceRow[]): Promise<Resource[]> {
  const supabase = await createClient();
  return Promise.all(
    rows.map(async (r) => {
      let href = r.external_url;
      if (!href && r.storage_path) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 3600);
        href = data?.signedUrl ?? null;
      }
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        type: r.type,
        description: r.description,
        externalUrl: r.external_url,
        storagePath: r.storage_path,
        published: r.published,
        createdAt: r.created_at,
        href,
      };
    })
  );
}

// Published resources, for the company portal.
export async function listPublishedResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return rowsToResources(data ?? []);
}

// All resources (admin management view).
export async function listAllResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return rowsToResources(data ?? []);
}
