// Companies data layer. Admin sees all; a company sees only its own row (RLS).
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

export interface Company {
  id: string;
  name: string;
  stage: string | null;
  industry: string | null;
  team: number | null;
  createdAt: string;
}

export function companyFromRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    stage: row.stage,
    industry: row.industry,
    team: row.team,
    createdAt: row.created_at,
  };
}

export async function listCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(companyFromRow);
}
