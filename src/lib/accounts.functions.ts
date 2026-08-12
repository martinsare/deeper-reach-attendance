import { createClient } from "@supabase/supabase-js";

import { normalizeEmail } from "@/lib/email";
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
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);

  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(error.message);
}

type AccountInput = {
  name: string;
  email: string;
  password: string;
  role: AccountRole;
};

function createEphemeralAuthClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) throw new Error("Supabase is not configured.");

  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createAccount({ name, email, password, role }: AccountInput) {
  const authClient = createEphemeralAuthClient();
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await authClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: name.trim() },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Unable to create account.");

  if (role === "admin") {
    await setAccountRole(data.user.id, "admin");
  }

  return data.user.id;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/auth`,
  });
  if (error) throw new Error(error.message);
}
