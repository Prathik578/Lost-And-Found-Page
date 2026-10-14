import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, HandHelping, MapPin, SearchCheck, ShieldCheck, TrendingUp } from "lucide-react";
import { recoveryRate, useItems } from "@/lib/items";
import { DemoNotice, PageShell } from "@/components/lf/ui";
import { ItemBrowser } from "@/components/lf/Browser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Lost & Found — Report and recover lost items" },
      { name: "description", content: "Report lost or found belongings on campus, search listings, and get items back to their owners." },
      { property: "og:title", content: "Campus Lost & Found" },
      { property: "og:description", content: "Report lost or found belongings on campus and help them get home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { items, error } = useItems();
  const count = (s: string) => (items ? items.filter((i) => i.status === s).length : "–");
  const rate = items ? recoveryRate(items) : null;

  return (
    <PageShell>
      <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-found">Campus utility</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Lost something?<br />Found something?</h1>
          <p className="mt-3 max-w-lg text-muted-foreground">Post it here so it can find its way back. Search what's been handed in, or report what you're missing.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/report" search={{ type: "lost" }} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition hover:bg-primary/90">
              <SearchCheck className="size-4" />Report Lost Item
            </Link>
            <Link to="/report" search={{ type: "found" }} className="inline-flex h-11 items-center gap-2 rounded-md border bg-card px-5 font-semibold transition hover:bg-secondary">
              <HandHelping className="size-4" />Report Found Item
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "lost", label: "Lost", cls: "text-lost bg-lost-soft" },
            { k: "found", label: "Found", cls: "text-found bg-found-soft" },
            { k: "returned", label: "Returned", cls: "text-returned bg-returned-soft" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</div>
              <div className="mt-2 font-display text-3xl font-bold">{count(s.k)}</div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load items. Check your connection and refresh the page.
        </div>
      )}

      {rate !== null && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
          <TrendingUp className="size-5 text-found" />
          <span className="text-sm font-medium">{rate}% of reported lost items have been returned</span>
        </div>
      )}

      <DemoNotice className="mt-8" />

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Recently reported</h2>
            <p className="text-sm text-muted-foreground">Everything reported, newest first. Returned items are also kept in <Link to="/history" className="font-medium text-found underline-offset-2 hover:underline">History</Link>.</p>
          </div>
        </div>
        <ItemBrowser items={items} />
      </section>

      <section className="mt-16 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-10">
        <h2 className="text-2xl font-bold">How to get your things back</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: SearchCheck, t: "1. Search first", d: "Check found items by keyword, category, or where you last had it." },
            { icon: ClipboardList, t: "2. Report it", d: "Post a lost report with identifying details so finders can recognise it." },
            { icon: MapPin, t: "3. Meet safely", d: "Follow the contact instructions — campus desks are the safest hand-off." },
            { icon: CheckCircle2, t: "4. Mark returned", d: "Once reunited, mark the item returned so it moves to History." },
          ].map(({ icon: I, t, d }) => (
            <div key={t}>
              <I className="size-6 opacity-80" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm opacity-75">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 flex items-start gap-2 text-sm opacity-80"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Never post passwords, student ID numbers, or personal documents. You never need to share your phone number or email publicly.</p>
      </section>
    </PageShell>
  );
}
