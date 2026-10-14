import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createItem } from "@/lib/items";
import { DemoNotice, PageShell } from "@/components/lf/ui";
import { ItemForm } from "@/components/lf/ItemForm";

export const Route = createFileRoute("/report")({
  validateSearch: (s: Record<string, unknown>): { type: "lost" | "found" } => ({ type: s["type"] === "found" ? "found" : "lost" }),
  head: () => ({
    meta: [
      { title: "Report an item — Campus Lost & Found" },
      { name: "description", content: "Report a lost or found item on campus." },
      { property: "og:title", content: "Report an item — Campus Lost & Found" },
      { property: "og:description", content: "Lost or found something on campus? Post it here." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { type } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to items</Link>
        <h1 className="mt-3 text-3xl font-bold">Report an item</h1>
        <p className="mt-1 text-muted-foreground">Fields marked * are required.</p>
        <DemoNotice className="my-6" />
        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] sm:p-8">
          <ItemForm
            key={type}
            initial={{ type }}
            submitLabel="Publish report"
            onSubmit={async (v) => {
              const item = await createItem(v);
              toast.success("Report published");
              navigate({ to: "/items/$id", params: { id: item.id } });
            }}
          />
        </div>
      </div>
    </PageShell>
  );
}
