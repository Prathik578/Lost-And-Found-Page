import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { CATEGORIES, defaultFilters, filterItems, type Filters, type Item } from "@/lib/items";
import { CardSkeletons, ItemCard } from "./ui";
import { Button } from "@/components/ui/button";

const sel = "h-10 rounded-md border bg-card px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring";

export function ItemBrowser({
  items, initial, lockStatus, emptyText,
}: { items: Item[] | null; initial?: Partial<Filters>; lockStatus?: boolean; emptyText?: string }) {
  const [f, setF] = useState<Filters>({ ...defaultFilters, ...initial });
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }));
  const locations = useMemo(() => [...new Set((items ?? []).map((i) => i.location))].sort(), [items]);
  const results = useMemo(() => (items ? filterItems(items, f) : []), [items, f]);
  const base = { ...defaultFilters, ...initial };
  const dirty = JSON.stringify(f) !== JSON.stringify(base);

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <label className="relative block">
          <span className="sr-only">Search items</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value.slice(0, 100))}
            placeholder="Search by title, description, location or category…"
            className="h-11 w-full rounded-md border bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {f.q && (
            <button type="button" aria-label="Clear search" onClick={() => set("q", "")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {!lockStatus && (
            <select aria-label="Status" className={sel} value={f.status} onChange={(e) => set("status", e.target.value as Filters["status"])}>
              <option value="all">All statuses</option><option value="lost">Lost</option><option value="found">Found</option><option value="returned">Returned</option>
            </select>
          )}
          <select aria-label="Category" className={sel} value={f.category} onChange={(e) => set("category", e.target.value as Filters["category"])}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Location" className={sel} value={f.location} onChange={(e) => set("location", e.target.value)}>
            <option value="all">All locations</option>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select aria-label="Sort" className={sel} value={f.sort} onChange={(e) => set("sort", e.target.value as Filters["sort"])}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span aria-live="polite">{items ? `${results.length} item${results.length === 1 ? "" : "s"}` : "Loading…"}</span>
        {dirty && <Button variant="ghost" size="sm" onClick={() => setF(base)}>Clear filters</Button>}
      </div>

      {!items ? (
        <CardSkeletons />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <h3 className="mt-3 font-semibold">No matching items</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyText ?? "Try a different search, loosen the filters, or report the item so others can help."}</p>
          {dirty && <Button className="mt-4" variant="outline" onClick={() => setF(base)}>Reset filters</Button>}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((i) => <ItemCard key={i.id} item={i} />)}
        </div>
      )}
    </div>
  );
}
