import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/data";

export type SessionState = {
  loading: boolean;
  session: Session | null;
  userId: string | null;
  name: string;
  username: string;
  role: AppRole | null;
  isAdmin: boolean;
};

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      if (!next?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", next.user.id).maybeSingle(),
        supabase.from("profiles").select("name, username").eq("id", next.user.id).maybeSingle(),
      ]);
      if (!active) return;
      setRole((roleRow?.role as AppRole) ?? null);
      setProfile(profileRow ?? null);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      void load(next);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const metaName = (session?.user.user_metadata?.["name"] as string | undefined) ?? "";
  const metaUsername = (session?.user.user_metadata?.["username"] as string | undefined) ?? "";

  return {
    loading,
    session,
    userId: session?.user.id ?? null,
    name: profile?.name || metaName || "Member",
    username: profile?.username || metaUsername,
    role,
    isAdmin: role === "admin",
  };
}