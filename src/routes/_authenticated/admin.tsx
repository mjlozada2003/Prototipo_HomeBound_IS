import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/homebound";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración — HomeBound" },
      { name: "description", content: "Estadísticas de actividad de HomeBound." },
      { property: "og:title", content: "Panel Admin — HomeBound" },
      { property: "og:description", content: "Monitoreo de pérdidas y hallazgos reportados." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, ready, name } = useAuth();
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    enabled: isAdmin,
    queryFn: async () => ((await supabase.from("posts").select("kind,category,resolved")).data ?? []) as Pick<Post, "kind" | "category" | "resolved">[],
  });

  if (!ready || (name === null && !isAdmin)) return <div className="p-12 text-center text-muted-foreground">Verificando acceso…</div>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md p-12 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-lost" />
      <h1 className="mt-3 text-2xl font-bold">Acceso solo para administradores</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-primary underline">Volver al inicio</Link>
    </div>
  );

  const count = (fn: (p: (typeof posts)[number]) => boolean) => posts.filter(fn).length;
  const active = count((p) => !p.resolved);
  const resolved = count((p) => p.resolved);
  const stats = [
    { label: "Publicaciones activas", value: active, cls: "bg-primary text-primary-foreground" },
    { label: "Resueltas", value: resolved, cls: "bg-secondary text-secondary-foreground" },
    { label: "Pérdidas", value: count((p) => p.kind === "perdido"), cls: "bg-lost text-lost-foreground" },
    { label: "Hallazgos", value: count((p) => p.kind === "encontrado"), cls: "bg-found text-found-foreground" },
    { label: "Mascotas", value: count((p) => p.category === "mascotas"), cls: "bg-card border" },
    { label: "Objetos", value: count((p) => p.category === "objetos"), cls: "bg-card border" },
  ];
  const rate = posts.length ? Math.round((resolved / posts.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">Panel de control</h1>
      <p className="text-muted-foreground">Actividad general de la plataforma · {posts.length} publicaciones en total</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-3xl p-6 ${s.cls}`}>
            <p className="font-display text-5xl font-bold">{s.value}</p>
            <p className="mt-1 font-semibold opacity-90">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border bg-card p-6">
        <p className="font-semibold">Tasa de resolución: {rate}%</p>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
        </div>
      </div>
    </div>
  );
}
