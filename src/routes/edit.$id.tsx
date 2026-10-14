import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { updateItem, useItems } from "@/lib/items";
import { PageShell } from "@/components/lf/ui";
import { ItemForm } from "@/components/lf/ItemForm";
import { NotFoundItem } from "./items.$id";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit listing — Campus Lost & Found" },
      { name: "description", content: "Update a lost or found item listing." },
      { property: "og:title", content: "Edit listing — Campus Lost & Found" },
      { property: "og:description", content: "Update a lost or found item listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { items, loading } = useItems();
  const navigate = useNavigate();
  const item = items?.find((i) => i.id === id);

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <Link to="/items/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to item</Link>
        {loading ? (
          <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" />
        ) : !item ? (
          <NotFoundItem />
        ) : (
          <>
            <h1 className="mt-3 mb-6 text-3xl font-bold">Edit listing</h1>
            <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] sm:p-8">
              <ItemForm
                initial={item}
                submitLabel="Save changes"
                onSubmit={async (v) => {
                  await updateItem(id, v);
                  toast.success("Changes saved");
                  navigate({ to: "/items/$id", params: { id } });
                }}
              />
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
