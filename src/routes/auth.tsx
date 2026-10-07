import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar o crear cuenta — HomeBound" },
      { name: "description", content: "Crea tu cuenta en HomeBound para reportar hallazgos y pérdidas." },
      { property: "og:title", content: "Únete a HomeBound" },
      { property: "og:description", content: "Crea tu perfil y ayuda a tu comunidad a encontrar lo perdido." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => { if (session) navigate({ to: "/" }); }, [session, navigate]);

  const submit = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    setErrors({});
    if (mode === "signup") {
      const r = signupSchema.safeParse(form);
      if (!r.success) {
        setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: r.data.email, password: r.data.password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: r.data.name } },
      });
      setLoading(false);
      if (error) return toast.error(error.message.includes("registered") ? "Este correo ya tiene una cuenta" : error.message);
      toast.success(`¡Bienvenido/a, ${r.data.name}! Tu cuenta fue creada con éxito.`);
    } else {
      if (!form.email || !form.password) return setErrors({ email: !form.email ? "Ingresa tu correo" : "", password: !form.password ? "Ingresa tu contraseña" : "" });
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      setLoading(false);
      if (error) return toast.error("Correo o contraseña incorrectos");
      toast.success("Sesión iniciada");
    }
    return;
  };

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-11 bg-background" />
      {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <img src={logo.url} alt="" className="mx-auto h-24 w-24 rounded-2xl" />
        <h1 className="mt-4 text-center text-3xl font-bold text-primary">{mode === "login" ? "Hola de nuevo" : "Crea tu cuenta"}</h1>
        <p className="mt-1 text-center text-muted-foreground">
          {mode === "login" ? "Ingresa para publicar y gestionar tus reportes." : "Así podrás reportar hallazgos y pérdidas."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && field("name", "Nombre")}
          {field("email", "Correo electrónico", "email")}
          {field("password", "Contraseña", "password")}
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Registrarme"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button className="font-semibold text-primary underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}>
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
