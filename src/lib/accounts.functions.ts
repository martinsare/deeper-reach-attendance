import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AccountRole = Database["public"]["Enums"]["app_role"];

export type AccountRow = Database["public"]["Tables"]["profiles"]["Row"] & {
  role: AccountRole;
};

export async function fetchAccounts(): Promise<AccountRow[]> {
  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase.from("profiles").select("id, email, name, created_at").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

  if (profilesError) throw new Error(profilesError.message);
  if (rolesError) throw new Error(rolesError.message);

  return (profiles ?? []).map((profile) => ({
    ...profile,
    role: roles?.find((row) => row.user_id === profile.id)?.role ?? "attendance_taker",
  }));
}

export async function setAccountRole(userId: string, role: AccountRole) {
  const { data: existing, error: readError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const mutation = existing
    ? supabase.from("user_roles").update({ role }).eq("user_id", userId)
    : supabase.from("user_roles").insert({ user_id: userId, role });

  const { error } = await mutation;
  if (error) throw new Error(error.message);
}
