import { createFileRoute } from "@tanstack/react-router";
import { useItems } from "@/lib/items";
import { PageShell } from "@/components/lf/ui";
import { ItemBrowser } from "@/components/lf/Browser";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Returned items history — Campus Lost & Found" },
      { name: "description", content: "Browse items that have been returned to their owners." },
      { property: "og:title", content: "Returned items — Campus Lost & Found" },
      { property: "og:description", content: "A searchable history of reunited belongings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { items } = useItems();
  return (
    <PageShell>
      <h1 className="text-3xl font-bold">Returned history</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Items that made it home. Open any item to view details or reopen it.</p>
      <ItemBrowser items={items} initial={{ status: "returned" }} lockStatus emptyText="No returned items match yet. When an item is marked returned, it appears here." />
    </PageShell>
  );
}
