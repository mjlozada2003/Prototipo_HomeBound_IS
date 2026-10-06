import type { Database } from "@/integrations/supabase/types";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Kind = "perdido" | "encontrado";
export type Category = "mascotas" | "objetos";

export const SUBCATEGORIES: Record<Category, { value: string; label: string }[]> = {
  mascotas: [
    { value: "perro", label: "Perro" },
    { value: "gato", label: "Gato" },
    { value: "otra_mascota", label: "Otra mascota" },
  ],
  objetos: [
    { value: "documentos", label: "Documentos" },
    { value: "electronicos", label: "Electrónicos" },
    { value: "llaves", label: "Llaves" },
    { value: "otro_objeto", label: "Otro objeto" },
  ],
};

export const subLabel = (v: string) =>
  [...SUBCATEGORIES.mascotas, ...SUBCATEGORIES.objetos].find((s) => s.value === v)?.label ?? v;

export const formatDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" });

export async function resizeImage(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}
