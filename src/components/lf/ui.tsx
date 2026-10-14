import { Link } from "@tanstack/react-router";
import {
  Backpack, BookOpen, Cpu, FileText, GlassWater, Package, Shirt, Watch, Search, Plus, History, Info, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Item, ItemStatus } from "@/lib/items";
import { formatDate } from "@/lib/items";

export const categoryIcon: Record<Category, LucideIcon> = {
  Electronics: Cpu, Stationery: BookOpen, Bags: Backpack, Clothing: Shirt, Accessories: Watch,
  "Water Bottles": GlassWater, Documents: FileText, Other: Package,
};

const statusStyle: Record<ItemStatus, string> = {
  lost: "bg-lost-soft text-lost",
  found: "bg-found-soft text-found",
  returned: "bg-returned-soft text-returned",
};
const statusLabel: Record<ItemStatus, string> = { lost: "Lost", found: "Found", returned: "Returned" };

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyle[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function ItemImage({ item, className }: { item: Item; className?: string }) {
  const Icon = categoryIcon[item.category] ?? Package;
  if (item.image) return <img src={item.image} alt={item.title} className={cn("object-cover", className)} />;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent to-surface text-accent-foreground", className)} aria-label="No photo">
      <Icon className="size-10 opacity-70" strokeWidth={1.5} />
      <span className="text-[11px] font-medium uppercase tracking-wider opacity-60">No photo</span>
    </div>
  );
}

/** Public card: never shows contact instructions. */
export function ItemCard({ item }: { item: Item }) {
  const Icon = categoryIcon[item.category];
  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ItemImage item={item} className="size-full transition duration-500 group-hover:scale-[1.03]" />
        <StatusBadge status={item.status} className="absolute left-3 top-3 shadow-sm" />
        {item.isDemo && (
          <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Demo</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Icon className="size-3.5" />{item.category}</span>
          <span>· {item.location}</span>
          <span>· {formatDate(item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function SiteHeader() {
  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground";
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Search className="size-4.5" /></span>
          <span className="font-display text-lg font-bold tracking-tight">Campus Lost &amp; Found</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={cn(link, "hidden sm:inline-flex")} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground bg-secondary" }}>Browse</Link>
          <Link to="/history" className={link} activeProps={{ className: "text-foreground bg-secondary" }}>
            <History className="size-4 sm:hidden" /><span className="hidden sm:inline">History</span>
          </Link>
          <Link to="/report" search={{ type: "lost" }} className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <Plus className="size-4" /><span className="hidden sm:inline">Report item</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function DemoNotice({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-dashed bg-card px-3 py-2 text-xs text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <strong className="text-foreground">Shared campus board.</strong> Reports are stored in a shared database and visible to everyone. There are no accounts, so anyone can edit or delete listings. Sample items are labelled as demo data.
      </p>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:pt-10">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Campus Lost &amp; Found · shared demo · sample items are demo data</footer>
    </div>
  );
}

export function CardSkeletons({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}
