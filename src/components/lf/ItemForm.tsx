import { useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { CATEGORIES, fileToDataUrl, itemInputSchema, todayISO, type ItemInput } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Errors = { [K in keyof ItemInput]?: string | undefined };
type FormState = { title: string; description: string; category: string; location: string; dateOccurred: string; image: string | null; type: string; contactInstructions: string };
const field = "w-full rounded-md border bg-card px-3 py-2.5 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive";

export function ItemForm({
  initial, submitLabel, onSubmit,
}: { initial: Partial<ItemInput>; submitLabel: string; onSubmit: (v: ItemInput) => void | Promise<void> }) {
  const [v, setV] = useState<FormState>({
    title: "", description: "", category: "", location: "", dateOccurred: todayISO(), image: null, type: "lost", contactInstructions: "",
    ...initial,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [imgBusy, setImgBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof ItemInput, val: string | null) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onFile(file?: File) {
    if (!file) return;
    setImgBusy(true);
    setErrors((e) => ({ ...e, image: undefined }));
    try {
      set("image", await fileToDataUrl(file));
    } catch (err) {
      setErrors((e) => ({ ...e, image: (err as Error).message }));
    } finally {
      setImgBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const r = itemInputSchema.safeParse(v);
    if (!r.success) {
      const errs: Errors = {};
      for (const iss of r.error.issues) {
        const k = iss.path[0] as keyof ItemInput;
        errs[k] ??= iss.message;
      }
      setErrors(errs);
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(r.data);
    } catch (err) {
      setFormError((err as Error).message);
      setSubmitting(false);
    }
  }

  const Err = ({ k }: { k: keyof ItemInput }) =>
    errors[k] ? <p id={`e-${k}`} className="mt-1.5 text-xs font-medium text-destructive">{errors[k]}</p> : null;
  const aria = (k: keyof ItemInput) => ({ id: `f-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `e-${k}` : undefined });
  const Label = ({ k, children, optional }: { k: string; children: React.ReactNode; optional?: boolean }) => (
    <label htmlFor={`f-${k}`} className="mb-1.5 block text-sm font-semibold">
      {children} {optional ? <span className="font-normal text-muted-foreground">(optional)</span> : <span className="text-destructive">*</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Did you lose or find this item? <span className="text-destructive">*</span></legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["lost", "found"] as const).map((t) => (
            <button
              key={t} type="button" role="radio" aria-checked={v.type === t} onClick={() => set("type", t)}
              className={cn("rounded-lg border px-4 py-3 text-left transition", v.type === t ? (t === "lost" ? "border-lost bg-lost-soft" : "border-found bg-found-soft") : "bg-card hover:bg-muted")}
            >
              <div className={cn("font-semibold", v.type === t && (t === "lost" ? "text-lost" : "text-found"))}>{t === "lost" ? "I lost something" : "I found something"}</div>
              <div className="text-xs text-muted-foreground">{t === "lost" ? "Ask others to keep an eye out" : "Help it get back to its owner"}</div>
            </button>
          ))}
        </div>
        <Err k="type" />
      </fieldset>

      <div>
        <Label k="title">Item title</Label>
        <input {...aria("title")} className={field} maxLength={80} placeholder="e.g. Blue steel water bottle" value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        <Err k="title" />
      </div>

      <div>
        <Label k="description">Description</Label>
        <textarea {...aria("description")} rows={4} maxLength={1000} className={field} placeholder="Colour, brand, stickers, marks — details that help identify it." value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        <Err k="description" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label k="category">Category</Label>
          <select {...aria("category")} className={field} value={v.category ?? ""} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Err k="category" />
        </div>
        <div>
          <Label k="dateOccurred">Date {v.type === "found" ? "found" : "lost"}</Label>
          <input {...aria("dateOccurred")} type="date" max={todayISO()} className={field} value={v.dateOccurred ?? ""} onChange={(e) => set("dateOccurred", e.target.value)} />
          <Err k="dateOccurred" />
        </div>
      </div>

      <div>
        <Label k="location">Location {v.type === "found" ? "found" : "lost"}</Label>
        <input {...aria("location")} className={field} maxLength={100} list="loc-suggest" placeholder="e.g. Main Library, 2nd floor" value={v.location ?? ""} onChange={(e) => set("location", e.target.value)} />
        <datalist id="loc-suggest">
          {["Main Library", "Student Union", "Science Building", "Lecture Hall B", "Gym", "Cafeteria", "Parking Lot A"].map((l) => <option key={l} value={l} />)}
        </datalist>
        <Err k="location" />
      </div>

      <div>
        <Label k="image" optional>Photo</Label>
        <div className="flex items-start gap-2 rounded-md bg-lost-soft px-3 py-2 text-xs text-lost">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>Don't photograph student IDs, passwords, bank cards, documents, or anything showing personal information.</span>
        </div>
        <div className="mt-2 flex items-center gap-4">
          {v.image ? (
            <img src={v.image} alt="Selected item" className="size-24 rounded-lg border object-cover" />
          ) : (
            <div className="grid size-24 place-items-center rounded-lg border border-dashed bg-muted text-muted-foreground"><ImagePlus className="size-6" /></div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileRef} id="f-image" type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={imgBusy} onClick={() => fileRef.current?.click()}>
              {imgBusy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{v.image ? "Change photo" : "Add photo"}
            </Button>
            {v.image && <Button type="button" variant="ghost" size="sm" onClick={() => set("image", null)}><Trash2 className="size-4" />Remove</Button>}
          </div>
        </div>
        <Err k="image" />
      </div>

      <div>
        <Label k="contactInstructions">Safe contact instructions</Label>
        <textarea {...aria("contactInstructions")} rows={3} maxLength={300} className={field} placeholder={v.type === "found" ? "e.g. Handed in at the Student Union info desk — describe it to claim." : "e.g. Please hand it to the Library front desk."} value={v.contactInstructions ?? ""} onChange={(e) => set("contactInstructions", e.target.value)} />
        <p className="mt-1.5 text-xs text-muted-foreground">You don't need to share a phone number or email. A campus desk or office is the safest hand-off point. Shown only on the item's detail page.</p>
        <Err k="contactInstructions" />
      </div>

      {formError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting || imgBusy}>
        {submitting && <Loader2 className="size-4 animate-spin" />}{submitLabel}
      </Button>
    </form>
  );
}
