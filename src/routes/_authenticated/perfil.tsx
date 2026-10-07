import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { KindBadge } from "@/components/PostCard";
import { formatDate, type Post } from "@/lib/homebound";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — HomeBound" },
      { name: "description", content: "Gestiona tus publicaciones en HomeBound." },
      { property: "og:title", content: "Mi perfil — HomeBound" },
      { property: "og:description", content: "Tus reportes de pérdidas y hallazgos." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const { name } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: posts = [] } = useQuery({
    queryKey: ["my-posts", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return (data ?? []) as Post[];
    },
  });

  const toggle = async (p: Post) => {
    const { error } = await supabase.from("posts").update({ resolved: !p.resolved }).eq("id", p.id);
    if (error) { toast.error("No se pudo actualizar"); return; }
    toast.success(p.resolved ? "Publicación reactivada" : "¡Qué alegría! Marcada como resuelta");
    qc.invalidateQueries();
  };

  const logout = async () => {
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{name ?? "Mi perfil"}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" onClick={logout} className="rounded-full"><LogOut /> Cerrar sesión</Button>
      </div>

      <h2 className="mt-8 mb-4 text-2xl font-semibold">Mis publicaciones</h2>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Aún no publicaste nada. <Link to="/publicar" className="font-semibold text-primary underline">Crear publicación</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border bg-card p-3">
              <img src={p.photo_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><KindBadge kind={p.kind} />{p.resolved && <span className="text-xs font-bold text-primary">RESUELTO</span>}</div>
                <Link to="/publicacion/$id" params={{ id: p.id }} className="block truncate font-semibold hover:underline">{p.title}</Link>
                <p className="text-sm text-muted-foreground">{formatDate(p.event_date)}</p>
              </div>
              <Button size="sm" variant={p.resolved ? "outline" : "default"} className="rounded-full" onClick={() => toggle(p)}>
                {p.resolved ? "Reactivar" : "Marcar resuelto"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
