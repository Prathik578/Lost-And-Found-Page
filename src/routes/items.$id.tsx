import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, MessageSquareText, Pencil, RotateCcw, SearchX, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteItem, formatDate, updateItem, useItems } from "@/lib/items";
import { categoryIcon, DemoNotice, ItemImage, PageShell, StatusBadge } from "@/components/lf/ui";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/items/$id")({
  head: () => ({
    meta: [
      { title: "Item details — Campus Lost & Found" },
      { name: "description", content: "Details and safe contact instructions for a lost or found item." },
      { property: "og:title", content: "Item details — Campus Lost & Found" },
      { property: "og:description", content: "Details for a lost or found item on campus." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ItemPage,
});

export function NotFoundItem() {
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mt-3 text-xl font-semibold">Item not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or the link is incorrect.</p>
      <Link to="/" className="mt-4 text-sm font-semibold text-found hover:underline">Browse all items</Link>
    </div>
  );
}

function ItemPage() {
  const { id } = Route.useParams();
  const { items, loading } = useItems();
  const navigate = useNavigate();
  const item = items?.find((i) => i.id === id);

  if (loading) return <PageShell><div className="h-[480px] animate-pulse rounded-xl bg-muted" /></PageShell>;
  if (!item) return <PageShell><NotFoundItem /></PageShell>;

  const Icon = categoryIcon[item.category];
  const returned = item.status === "returned";
  const markLabel = item.type === "lost" ? "Mark as recovered" : "Mark as returned to owner";

  return (
    <PageShell>
      <Link to={returned ? "/history" : "/"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
          <ItemImage item={item} className="aspect-[4/3] w-full" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"><Icon className="size-3.5" />{item.category}</span>
            {item.isDemo && <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Demo data</span>}
          </div>
          <h1 className="mt-3 text-3xl font-bold">{item.title}</h1>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">{item.description}</p>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><dt className="sr-only">Location</dt><dd>{item.location}</dd></div>
            <div className="flex items-center gap-2"><Calendar className="size-4 text-muted-foreground" /><dt className="sr-only">Date</dt><dd>{item.type === "lost" ? "Lost" : "Found"} {formatDate(item.dateOccurred)}</dd></div>
            <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><dt className="sr-only">Reported</dt><dd>Reported {formatDate(item.createdAt)}</dd></div>
            {item.updatedAt !== item.createdAt && <div className="flex items-center gap-2"><Pencil className="size-4 text-muted-foreground" /><dt className="sr-only">Updated</dt><dd>Updated {formatDate(item.updatedAt)}</dd></div>}
          </dl>

          <div className="mt-6 rounded-xl border bg-surface p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-4" />How to {item.type === "found" ? "claim it" : "help"}</h2>
            <p className="mt-1.5 text-sm">{item.contactInstructions}</p>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" />Meet at a staffed campus location. Be ready to describe identifying details. This app does not verify identities.</p>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner actions</p>
            <div className="flex flex-wrap gap-2">
              {returned ? (
                <Button variant="outline" onClick={() => { updateItem(item.id, { status: item.type }).then(() => toast.success("Listing reopened")).catch(() => toast.error("Could not update item")); }}>
                  <RotateCcw className="size-4" />Reopen as {item.type}
                </Button>
              ) : (
                <Button onClick={() => { updateItem(item.id, { status: "returned" }).then(() => toast.success("Marked as returned — moved to History")).catch(() => toast.error("Could not update item")); }}>
                  <CheckCircle2 className="size-4" />{markLabel}
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/edit/$id" params={{ id: item.id }}><Pencil className="size-4" />Edit</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="size-4" />Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                    <AlertDialogDescription>"{item.title}" will be permanently removed. If it was reunited with its owner, consider marking it returned instead so it stays in History.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => { deleteItem(item.id).then(() => { toast.success("Listing deleted"); navigate({ to: "/" }); }).catch(() => toast.error("Could not delete item")); }}
                    >Delete listing</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <DemoNotice className="mt-6" />
        </div>
      </div>
    </PageShell>
  );
}
