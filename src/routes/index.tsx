import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, PawPrint, Package, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBCATEGORIES, type Post } from "@/lib/homebound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeBound — Encuentra lo perdido, devuelve lo hallado" },
      { name: "description", content: "Plataforma colaborativa para reportar y buscar mascotas y objetos perdidos o encontrados." },
      { property: "og:title", content: "HomeBound — Búsqueda colaborativa" },
      { property: "og:description", content: "Reporta y encuentra mascotas y objetos perdidos con ayuda de tu comunidad." },
    ],
  }),
  component: Home,
});

const DATE_RANGES = [
  { value: "all", label: "Cualquier fecha" },
  { value: "3", label: "Últimos 3 días" },
  { value: "7", label: "Última semana" },
  { value: "30", label: "Último mes" },
];

function Home() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "perdido" | "encontrado">("all");
  const [category, setCategory] = useState<"all" | "mascotas" | "objetos">("all");
  const [sub, setSub] = useState("all");
  const [range, setRange] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const since = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000);
    return posts.filter((p) =>
      (kind === "all" || p.kind === kind) &&
      (category === "all" || p.category === category) &&
      (sub === "all" || p.subcategory === sub) &&
      (!since || new Date(p.event_date + "T23:59:59") >= since) &&
      (!term || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.location.toLowerCase().includes(term)),
    );
  }, [posts, q, kind, category, sub, range]);

  const hasFilters = q || kind !== "all" || category !== "all" || range !== "all";
  const reset = () => { setQ(""); setKind("all"); setCategory("all"); setSub("all"); setRange("all"); };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-10 text-center md:py-14">
        <h1 className="text-4xl font-bold text-primary md:text-5xl">Ayudemos a que todo vuelva a casa</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          Publica lo que perdiste o encontraste. Tu comunidad te ayuda a reunir mascotas y objetos con sus dueños.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full bg-lost text-lost-foreground hover:bg-lost/90">
            <Link to="/publicar" search={{ tipo: "perdido" }}>Perdí algo</Link>
          </Button>
          <Button asChild size="lg" className="rounded-full bg-found text-found-foreground hover:bg-found/90">
            <Link to="/publicar" search={{ tipo: "encontrado" }}>Encontré algo</Link>
          </Button>
        </div>
      </section>

      <section className="sticky top-[70px] z-20 -mx-4 mb-6 border-y bg-background/95 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre, descripción o lugar…" className="h-12 rounded-full bg-card pl-12 text-base" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border bg-card p-1">
              {(["all", "perdido", "encontrado"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${kind === k ? (k === "perdido" ? "bg-lost text-lost-foreground" : k === "encontrado" ? "bg-found text-found-foreground" : "bg-primary text-primary-foreground") : "text-muted-foreground"}`}>
                  {k === "all" ? "Todos" : k === "perdido" ? "Perdidos" : "Encontrados"}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border bg-card p-1">
              {([["all", "Todo", null], ["mascotas", "Mascotas", PawPrint], ["objetos", "Objetos", Package]] as const).map(([c, label, Icon]) => (
                <button key={c} onClick={() => { setCategory(c); setSub("all"); }}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition ${category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {Icon && <Icon className="h-4 w-4" />}{label}
                </button>
              ))}
            </div>
            {category !== "all" && (
              <Select value={sub} onValueChange={setSub}>
                <SelectTrigger className="w-44 rounded-full bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las subcategorías</SelectItem>
                  {SUBCATEGORIES[category].map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-44 rounded-full bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{DATE_RANGES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
            {hasFilters && <Button variant="ghost" size="sm" onClick={reset}><X /> Limpiar</Button>}
          </div>
        </div>
      </section>

      <p className="mb-4 text-sm font-semibold text-muted-foreground">
        {isLoading ? "Cargando publicaciones…" : `${filtered.length} publicaciones`}
      </p>
      {!isLoading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          No hay publicaciones con esos filtros. Prueba con otra búsqueda.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
