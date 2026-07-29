import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type StaffEmployee = { id: string; name: string; email: string; role: "staff" | "admin" };

export function useStaffSession() {
  const [employee, setEmployee] = useState<StaffEmployee | null | undefined>(undefined);

  async function loadEmployee(userId: string) {
    const { data } = await supabase
      .from("employees")
      .select("id, name, email, role")
      .eq("auth_user_id", userId)
      .single();
    setEmployee((data as StaffEmployee) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadEmployee(data.session.user.id);
      else setEmployee(null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadEmployee(session.user.id);
      else setEmployee(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Correo o contraseña incorrectos.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setEmployee(null);
  }

  return { employee, loading: employee === undefined, login, logout };
}
