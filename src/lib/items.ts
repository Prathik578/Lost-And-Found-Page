import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "./supabase";

export const CATEGORIES = [
  "Electronics",
  "Stationery",
  "Bags",
  "Clothing",
  "Accessories",
  "Water Bottles",
  "Documents",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type ItemType = "lost" | "found";
export type ItemStatus = "lost" | "found" | "returned";

export interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  dateOccurred: string; // YYYY-MM-DD
  image: string | null; // data URL
  type: ItemType;
  status: ItemStatus;
  contactInstructions: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

/** Raw row shape from the Supabase `items` table (snake_case). */
interface ItemRow {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  date_occurred: string;
  image: string | null;
  type: ItemType;
  status: ItemStatus;
  contact_instructions: string;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

function rowToItem(r: ItemRow): Item {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    location: r.location,
    dateOccurred: r.date_occurred,
    image: r.image,
    type: r.type,
    status: r.status,
    contactInstructions: r.contact_instructions,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isDemo: r.is_demo ?? false,
  };
}

function itemToRow(
  input: ItemInput,
): Omit<ItemRow, "id" | "created_at" | "updated_at" | "is_demo"> {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    date_occurred: input.dateOccurred,
    image: input.image,
    type: input.type,
    status: input.type,
    contact_instructions: input.contactInstructions,
  };
}

export const itemInputSchema = z.object({
  title: z.string().trim().min(3, "Give the item a short title (3+ characters)").max(80, "Keep the title under 80 characters"),
  description: z.string().trim().min(10, "Add a few details (10+ characters) so it can be identified").max(1000, "Keep it under 1000 characters"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  location: z.string().trim().min(2, "Where was it lost or found?").max(100, "Keep the location under 100 characters"),
  dateOccurred: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .refine((d) => d <= todayISO(), "The date can't be in the future"),
  image: z.string().nullable(),
  type: z.enum(["lost", "found"], { errorMap: () => ({ message: "Choose Lost or Found" }) }),
  contactInstructions: z
    .string()
    .trim()
    .min(5, "Explain how someone can safely reach you or collect the item")
    .max(300, "Keep it under 300 characters"),
});
export type ItemInput = z.infer<typeof itemInputSchema>;

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------- filtering ---------- */
export interface Filters {
  q: string;
  status: "all" | ItemStatus;
  category: "all" | Category;
  location: string; // "all" or exact location
  sort: "newest" | "oldest";
}
export const defaultFilters: Filters = { q: "", status: "all", category: "all", location: "all", sort: "newest" };

export function filterItems(items: Item[], f: Filters): Item[] {
  const terms = f.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const out = items.filter((i) => {
    if (f.status !== "all" && i.status !== f.status) return false;
    if (f.category !== "all" && i.category !== f.category) return false;
    if (f.location !== "all" && i.location !== f.location) return false;
    if (terms.length) {
      const hay = `${i.title} ${i.description} ${i.location} ${i.category}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  out.sort((a, b) =>
    f.sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt),
  );
  return out;
}

/* ---------- pub/sub for reactive updates ---------- */
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

/* ---------- Supabase persistence ---------- */
const TABLE = "items";

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ItemRow[]).map(rowToItem);
}

export async function createItem(input: ItemInput): Promise<Item> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(itemToRow(input))
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Could not create the item — please try again.");
  const item = rowToItem(data as ItemRow);
  notify();
  return item;
}

export async function updateItem(
  id: string,
  patch: Partial<Omit<Item, "id" | "createdAt">>,
): Promise<Item> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.dateOccurred !== undefined) row.date_occurred = patch.dateOccurred;
  if (patch.image !== undefined) row.image = patch.image;
  if (patch.type !== undefined) {
    row.type = patch.type;
    if (patch.status === undefined) row.status = patch.type;
  }
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.contactInstructions !== undefined) row.contact_instructions = patch.contactInstructions;

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Item not found");
  const item = rowToItem(data as ItemRow);
  notify();
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  notify();
}

/** Seed demo items if the table is empty. */
async function seedIfEmpty(): Promise<void> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  if (count && count > 0) return;

  const demoRows: Omit<ItemRow, "id" | "created_at" | "updated_at">[] = [
    { title: "Blue steel water bottle", description: "32oz insulated bottle, navy blue with a mountain sticker and a dent near the base.", category: "Water Bottles", location: "Main Library", date_occurred: todayISO(), image: null, type: "found", status: "found", contact_instructions: "Handed in at the Library front desk — ask staff for the lost property box.", is_demo: true },
    { title: "TI-84 Plus calculator", description: "Black graphing calculator in a grey slide case. Initials scratched on the back.", category: "Electronics", location: "Science Building", date_occurred: daysAgoISO(1), image: null, type: "lost", status: "lost", contact_instructions: "Leave a note with the Science Building reception desk, room S-101.", is_demo: true },
    { title: "Green canvas backpack", description: "Forest green backpack with a broken left zipper pull and a keychain carabiner.", category: "Bags", location: "Student Union", date_occurred: daysAgoISO(2), image: null, type: "found", status: "found", contact_instructions: "At the Student Union info desk. Describe the contents to claim it.", is_demo: true },
    { title: "Spiral notebook — Organic Chem", description: "Yellow 5-subject notebook with handwritten chemistry notes. Very important for finals!", category: "Stationery", location: "Lecture Hall B", date_occurred: daysAgoISO(3), image: null, type: "lost", status: "lost", contact_instructions: "Drop it at the Chemistry department office; they'll contact me via the course portal.", is_demo: true },
    { title: "Set of keys with red lanyard", description: "Three keys on a red university lanyard with a small bottle-opener charm.", category: "Accessories", location: "Gym", date_occurred: daysAgoISO(5), image: null, type: "found", status: "returned", contact_instructions: "Collected from the Gym front desk.", is_demo: true },
    { title: "Grey university hoodie", description: "Medium grey pullover hoodie, faded logo, left on a bench.", category: "Clothing", location: "Cafeteria", date_occurred: daysAgoISO(6), image: null, type: "lost", status: "lost", contact_instructions: "Please hand to cafeteria staff — I check in daily at lunch.", is_demo: true },
  ];

  const { error: insertError } = await supabase.from(TABLE).insert(demoRows);
  if (insertError) throw insertError;
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function resetDemo(): void {
  (async () => {
    await supabase.from(TABLE).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await seedIfEmpty();
    notify();
  })();
}

/** null while loading, Error if the fetch failed. */
export function useItems(): { items: Item[] | null; error: Error | null; loading: boolean } {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchItems();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await seedIfEmpty();
        const data = await fetchItems();
        if (mounted) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) setError(e as Error);
      }
    })();

    const l = () => { refresh(); };
    listeners.add(l);

    const channel = supabase
      .channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => refresh())
      .subscribe();

    return () => {
      mounted = false;
      listeners.delete(l);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { items, error, loading: items === null && error === null };
}

/** Resize an image file to a compact JPEG data URL. */
export async function fileToDataUrl(file: File, max = 900): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10 MB");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Couldn't read that image"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function formatDate(iso: string) {
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Derived KPI: percentage of all lost reports that have been returned. */
export function recoveryRate(items: Item[]): number {
  const lost = items.filter((i) => i.type === "lost");
  if (lost.length === 0) return 0;
  const returned = lost.filter((i) => i.status === "returned").length;
  return Math.round((returned / lost.length) * 100);
}
