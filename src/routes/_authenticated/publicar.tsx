import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, PawPrint, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SUBCATEGORIES, resizeImage, type Category, type Kind } from "@/lib/homebound";

export const Route = createFileRoute("/_authenticated/publicar")({
  validateSearch: (s: Record<string, unknown>): { tipo?: Kind } =>
    s["tipo"] === "perdido" || s["tipo"] === "encontrado" ? { tipo: s["tipo"] } : {},
  head: () => ({
    meta: [
      { title: "Publicar — HomeBound" },
      { name: "description", content: "Publica una mascota u objeto perdido o encontrado." },
      { property: "og:title", content: "Publicar en HomeBound" },
      { property: "og:description", content: "Reporta una pérdida o un hallazgo en tu comunidad." },
    ],
  }),
  component: Publish,
});

const today = () => new Date().toISOString().slice(0, 10);

function Publish() {
  const search = Route.useSearch();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>(search.tipo ?? "perdido");
  const [category, setCategory] = useState<Category | "">("");
  const [f, setF] = useState({ subcategory: "", title: "", description: "", event_date: today(), location: "", contact: "", photo: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const schema = z.object({
    category: z.enum(["mascotas", "objetos"], { message: "Elige una categoría" }),
    subcategory: z.string().min(1, "Elige una subcategoría"),
    title: z.string().trim().min(3, "Mínimo 3 caracteres").max(100),
    description: z.string().trim().min(10, "Describe con al menos 10 caracteres").max(1000),
    event_date: z.string().min(1, "Indica la fecha").refine((d) => d <= today(), "La fecha no puede ser futura"),
    location: z.string().trim().min(2, "Indica el lugar").max(120),
    photo: z.string().min(1, "Agrega una foto"),
    contact: kind === "perdido"
      ? z.string().trim().min(5, "El contacto es obligatorio en pérdidas").max(120)
      : z.string().trim().max(120),
  });

  const onPhoto = async (file?: File): Promise<void> => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("El archivo debe ser una imagen"); return; }
    setF((p) => ({ ...p, photo: "" }));
    const data = await resizeImage(file);
    setF((p) => ({ ...p, photo: data }));
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const r = schema.safeParse({ ...f, category });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      toast.error("Completa todos los datos obligatorios");
      return;
    }
    setErrors({});
    setSaving(true);
    const d = r.data;
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id, kind, category: d.category, subcategory: d.subcategory, title: d.title,
      description: d.description, event_date: d.event_date, location: d.location,
      photo_url: d.photo, contact: d.contact || null,
    }).select("id").single();
    setSaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "Ya publicaste esto antes: misma publicación, tipo, categoría y fecha." : "No se pudo publicar. Revisa los datos.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["posts"] });
    toast.success("¡Publicación creada! Ya es visible para la comunidad.");
    navigate({ to: "/publicacion/$id", params: { id: data.id } });
  };

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;
  const lost = kind === "perdido";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">Nueva publicación</h1>
      <p className="text-muted-foreground">Todos los campos marcados con * son obligatorios.</p>

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-3xl border bg-card p-6">
        <div className="grid grid-cols-2 gap-3">
          {(["perdido", "encontrado"] as const).map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)}
              className={`rounded-2xl border-2 p-4 text-left transition ${kind === k ? (k === "perdido" ? "border-lost bg-lost/10" : "border-found bg-found/10") : "border-border"}`}>
              <p className={`font-display text-xl font-semibold ${k === "perdido" ? "text-lost" : "text-found"}`}>{k === "perdido" ? "Perdí algo" : "Encontré algo"}</p>
              <p className="text-sm text-muted-foreground">{k === "perdido" ? "Busco a mi mascota u objeto" : "Quiero devolverlo a su dueño"}</p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Categoría *</Label>
          <div className="grid grid-cols-2 gap-3">
            {([["mascotas", "Mascota", PawPrint], ["objetos", "Objeto", Package]] as const).map(([c, label, Icon]) => (
              <button type="button" key={c} onClick={() => { setCategory(c); setF({ ...f, subcategory: "" }); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-semibold ${category === c ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>
                <Icon className="h-5 w-5" /> {label}
              </button>
            ))}
          </div>
          {err("category")}
          {category && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUBCATEGORIES[category].map((s) => (
                <button type="button" key={s.value} onClick={() => setF({ ...f, subcategory: s.value })}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${f.subcategory === s.value ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {err("subcategory")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={lost ? "Ej: Max, golden retriever" : "Ej: Gatita gris en la plaza"} />
          {err("title")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descripción *</Label>
          <Textarea id="desc" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Color, tamaño, señas particulares…" />
          {err("description")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">{lost ? "Fecha en que se perdió *" : "Fecha en que lo encontraste *"}</Label>
            <Input id="date" type="date" max={today()} value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} />
            {err("event_date")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Lugar *</Label>
            <Input id="loc" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Barrio, calle o referencia" />
            {err("location")}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact">Contacto {lost ? "*" : "(opcional)"}</Label>
          <Input id="contact" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Teléfono, WhatsApp o correo" />
          {!lost && <p className="text-xs text-muted-foreground">Si no lo compartes, se mostrará “Contacto no compartido”.</p>}
          {err("contact")}
        </div>
        <div className="space-y-1.5">
          <Label>Foto *</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-background p-4 text-muted-foreground hover:border-primary">
            {f.photo ? <img src={f.photo} alt="Vista previa" className="max-h-64 rounded-xl object-contain" /> : (<><ImagePlus className="h-8 w-8" /><span>Toca para subir una foto</span></>)}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          {err("photo")}
        </div>
        <Button type="submit" size="lg" disabled={saving} className={`w-full rounded-full ${lost ? "bg-lost text-lost-foreground hover:bg-lost/90" : "bg-found text-found-foreground hover:bg-found/90"}`}>
          {saving ? "Publicando…" : lost ? "Publicar pérdida" : "Publicar hallazgo"}
        </Button>
      </form>
    </div>
  );
}
