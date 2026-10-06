import { Link } from "@tanstack/react-router";
import { PawPrint, Package, CalendarDays, MapPin } from "lucide-react";
import type { Post } from "@/lib/homebound";
import { formatDate, subLabel } from "@/lib/homebound";

export function KindBadge({ kind }: { kind: string }) {
  const lost = kind === "perdido";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${lost ? "bg-lost text-lost-foreground" : "bg-found text-found-foreground"}`}>
      {lost ? "Perdido" : "Encontrado"}
    </span>
  );
}

export function CategoryChip({ category, sub }: { category: string; sub: string }) {
  const Icon = category === "mascotas" ? PawPrint : Package;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
      <Icon className="h-3.5 w-3.5" /> {category === "mascotas" ? "Mascota" : "Objeto"} · {subLabel(sub)}
    </span>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/publicacion/$id"
      params={{ id: post.id }}
      className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={post.photo_url} alt={post.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        <div className="absolute left-3 top-3"><KindBadge kind={post.kind} /></div>
        {post.resolved && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
            <span className="rounded-full bg-background px-4 py-1 font-display font-semibold text-primary">¡Resuelto!</span>
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <CategoryChip category={post.category} sub={post.subcategory} />
        <h3 className="line-clamp-1 text-lg font-semibold">{post.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatDate(post.event_date)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{post.location}</span>
        </div>
      </div>
    </Link>
  );
}
