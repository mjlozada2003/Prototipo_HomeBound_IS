import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CategoryChip, KindBadge } from "@/components/PostCard";
import { formatDate, type Post } from "@/lib/homebound";

export const Route = createFileRoute("/publicacion/$id")({
  head: () => ({
    meta: [
      { title: "Publicación — HomeBound" },
      { name: "description", content: "Detalle de una mascota u objeto perdido o encontrado en HomeBound." },
      { property: "og:title", content: "¿Lo has visto? — HomeBound" },
      { property: "og:description", content: "Ayuda a que esta mascota u objeto vuelva a casa." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      return data as Post | null;
    },
  });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado. ¡Compártelo en tus redes!");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Cargando…</div>;
  if (!post) return (
    <div className="p-12 text-center">
      <p className="text-muted-foreground">Esta publicación no existe.</p>
      <Link to="/" className="mt-4 inline-block font-semibold text-primary underline">Volver al inicio</Link>
    </div>
  );

  const lost = post.kind === "perdido";
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border bg-muted">
          <img src={post.photo_url} alt={post.title} className="aspect-square h-full w-full object-cover" />
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={post.kind} />
            <CategoryChip category={post.category} sub={post.subcategory} />
            {post.resolved && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">RESUELTO</span>}
          </div>
          <h1 className="text-4xl font-bold text-primary">{post.title}</h1>
          <p className="text-lg leading-relaxed">{post.description}</p>
          <div className="space-y-2 rounded-2xl bg-card p-4 border">
            <p className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-secondary" /> {lost ? "Se perdió el" : "Se encontró el"} <b>{formatDate(post.event_date)}</b></p>
            <p className="flex items-center gap-2"><MapPin className="h-5 w-5 text-secondary" /> {post.location}</p>
            <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-secondary" /> {post.contact || "Contacto no compartido"}</p>
          </div>
          <Button size="lg" onClick={share} className="w-full rounded-full"><Share2 /> Compartir</Button>
        </div>
      </div>
    </div>
  );
}
