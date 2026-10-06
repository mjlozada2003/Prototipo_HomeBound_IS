import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { session: Session | null; name: string | null; isAdmin: boolean; ready: boolean };
const Ctx = createContext<AuthCtx>({ session: null, name: null, isAdmin: false, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthCtx>({ session: null, name: null, isAdmin: false, ready: false });

  useEffect(() => {
    const load = async (session: Session | null) => {
      if (!session) return setState({ session: null, name: null, isAdmin: false, ready: true });
      setState((s) => ({ ...s, session, ready: true }));
      const uid = session.user.id;
      const [{ data: prof }, { data: admin }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      ]);
      setState({ session, name: prof?.display_name ?? null, isAdmin: !!admin, ready: true });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => load(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => load(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
