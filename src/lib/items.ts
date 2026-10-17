import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

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

/* ---------- In-memory demo persistence ---------- */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const demoItems: Item[] = [
  ["Blue steel water bottle", "32oz insulated bottle, navy blue with a mountain sticker and a dent near the base.", "Water Bottles", "Main Library", 0, "found", "Handed in at the Library front desk — ask staff for the lost property box."],
  ["TI-84 Plus calculator", "Black graphing calculator in a grey slide case. Initials scratched on the back.", "Electronics", "Science Building", 1, "lost", "Leave a note with the Science Building reception desk, room S-101."],
  ["Green canvas backpack", "Forest green backpack with a broken left zipper pull and a keychain carabiner.", "Bags", "Student Union", 2, "found", "At the Student Union info desk. Describe the contents to claim it."],
  ["Spiral notebook — Organic Chem", "Yellow 5-subject notebook with handwritten chemistry notes.", "Stationery", "Lecture Hall B", 3, "lost", "Drop it at the Chemistry department office."],
  ["Set of keys with red lanyard", "Three keys on a red university lanyard with a bottle-opener charm.", "Accessories", "Gym", 5, "returned", "Collected from the Gym front desk."],
  ["Grey university hoodie", "Medium grey pullover hoodie, faded logo, left on a bench.", "Clothing", "Cafeteria", 6, "lost", "Please hand to cafeteria staff."],
].map(([title, description, category, location, days, type, contactInstructions], index) => {
  const timestamp = new Date(Date.now() - Number(days) * 86400000 - index * 60000).toISOString();
  return { id: `demo-${index + 1}`, title: String(title), description: String(description), category: category as Category, location: String(location), dateOccurred: daysAgoISO(Number(days)), image: null, type: type as ItemType, status: type as ItemStatus, contactInstructions: String(contactInstructions), createdAt: timestamp, updatedAt: timestamp, isDemo: true };
});
let store: Item[] = [...demoItems];

export async function fetchItems(): Promise<Item[]> { return [...store]; }
export async function createItem(input: ItemInput): Promise<Item> {
  const now = new Date().toISOString();
  const item: Item = { ...input, id: crypto.randomUUID(), status: input.type, createdAt: now, updatedAt: now };
  store = [item, ...store]; notify(); return item;
}
export async function updateItem(id: string, patch: Partial<Omit<Item, "id" | "createdAt">>): Promise<Item> {
  const existing = store.find((item) => item.id === id);
  if (!existing) throw new Error("Item not found");
  const item = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  store = store.map((entry) => entry.id === id ? item : entry); notify(); return item;
}
export async function deleteItem(id: string): Promise<void> { store = store.filter((item) => item.id !== id); notify(); }
export function resetDemo(): void { store = [...demoItems]; notify(); }

export function useItems(): { items: Item[] | null; error: Error | null; loading: boolean } {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => { setItems(await fetchItems()); setError(null); }, []);
  useEffect(() => { void refresh(); const listener = () => void refresh(); listeners.add(listener); return () => listeners.delete(listener); }, [refresh]);
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
