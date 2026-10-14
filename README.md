# Campus Lost & Found

A polished, full-stack web app for students to report and recover lost belongings on campus. Built with TanStack Start, React, Tailwind CSS, and Supabase.

## Table of Contents

- [What This App Does](#what-this-app-does)
- [Screens & Views](#screens--views)
- [Tech Stack Decisions](#tech-stack-decisions)
- [Project Structure](#project-structure)
- [Architecture Decisions (Start to End)](#architecture-decisions-start-to-end)
- [File-by-File Breakdown](#file-by-file-breakdown)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [What Comes Next](#what-comes-next)

---

## What This App Does

Campus Lost & Found is a shared board where students can:

- **Report lost items** — post a listing with a title, description, category, location, date, optional photo, and safe contact instructions.
- **Report found items** — same form, but flagged as "found" so others searching for their lost belongings can find it.
- **Search and filter** — full-text search across titles, descriptions, locations, and categories, combined with filters for status, category, and location, plus sort by newest or oldest.
- **View item details** — each item has a dedicated page with photo, metadata, and safe contact instructions (never public phone numbers or emails).
- **Edit listings** — update any field on an existing report.
- **Mark items as returned** — move an item to "returned" status; it stays visible in a separate History page rather than disappearing.
- **Delete listings** — with a confirmation dialog to prevent accidental loss.
- **Track recovery rate** — the dashboard shows what percentage of reported lost items have been reunited with their owners.
- **See updates in real time** — when anyone reports, edits, or marks an item, all open browsers update instantly via Supabase Realtime.

The app is a single-tenant shared board: there are no accounts, and all students see the same items. Sample items are seeded on first load and labelled as demo data.

---

## Screens & Views

| Route | Purpose |
|---|---|
| `/` | Home dashboard — hero with report CTAs, live summary counts (lost / found / returned), recovery rate KPI, recently reported items with search and filters, and a "how to get your things back" guide. |
| `/report` | Item reporting form — one reusable form for both lost and found items. The `?type=lost` or `?type=found` search param pre-selects the type. |
| `/items/$id` | Item detail — full photo, description, metadata grid, safe contact instructions, and owner actions (mark returned, reopen, edit, delete). |
| `/edit/$id` | Edit listing — same form as report, pre-filled with the item's current values. |
| `/history` | Returned history — a filtered browser showing only returned items, with the status filter locked. |

---

## Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | TanStack Start (SSR) | Server-rendered React with file-based routing, code-splitting, and Nitro deployment. |
| Router | TanStack Router | Type-safe, file-based routing with search-param validation and nested layouts. |
| Data fetching | TanStack React Query | Caching, dedup, and background refetch for server state. |
| Database | Supabase (PostgreSQL) | Managed Postgres with RLS, realtime subscriptions, and a JS client that works in the browser. |
| Styling | Tailwind CSS v4 | Utility-first CSS with oklch design tokens and a semantic color system. |
| UI primitives | shadcn/ui (New York) | Accessible, unstyled Radix primitives composed into reusable components. |
| Icons | Lucide React | Consistent, tree-shakeable icon set. |
| Validation | Zod | Schema validation with inferred TypeScript types for the item form. |
| Forms | React Hook Form + custom form | Controlled components with Zod validation on submit. |
| Notifications | Sonner | Toast notifications for create/update/delete confirmations. |
| Testing | Vitest + Testing Library | Unit tests for domain logic and routing smoke tests. |

---

## Project Structure

```
src/
├── components/
│   ├── lf/                    # App-specific components
│   │   ├── Browser.tsx        # Searchable, filterable item grid
│   │   ├── ItemForm.tsx       # Reusable form for report + edit
│   │   └── ui.tsx             # Shared UI: cards, badges, header, shells
│   └── ui/                    # shadcn primitives (button, dialog, etc.)
├── hooks/
│   └── use-mobile.tsx         # Responsive breakpoint hook
├── lib/
│   ├── items.ts               # Domain logic, data layer, useItems hook
│   ├── items.test.ts          # Unit tests for filtering, validation, KPIs
│   ├── supabase.ts            # Supabase client singleton
│   ├── utils.ts               # cn() Tailwind class helper
│   ├── error-capture.ts       # SSR error capture and recovery
│   ├── error-page.ts          # Static 500 error HTML page
│   └── lovable-error-reporting.ts  # Editor telemetry bridge
├── routes/
│   ├── __root.tsx             # Root layout, head, error/404 boundaries
│   ├── index.tsx              # Home dashboard
│   ├── report.tsx             # Report form page
│   ├── items.$id.tsx          # Item detail page
│   ├── edit.$id.tsx           # Edit form page
│   └── history.tsx            # Returned history page
├── test/
│   ├── app-routing.test.tsx   # Route tree smoke test
│   └── setup.ts               # Vitest DOM polyfills
├── router.tsx                 # Router factory
├── routeTree.gen.ts           # Auto-generated route tree
├── server.ts                  # SSR server entry (Nitro/Cloudflare)
├── start.ts                   # TanStack Start config + middleware
└── styles.css                 # Tailwind theme tokens
```

---

## Architecture Decisions (Start to End)

### Decision 1: Supabase as the persistence layer

The original app used browser localStorage — data was per-device and not shared. We migrated to Supabase (managed PostgreSQL) so all students see the same board. The `items` table has RLS enabled with `anon, authenticated` policies because this is a single-tenant shared board with no sign-in. The Supabase client is a singleton in `src/lib/supabase.ts`, and all data operations go through `src/lib/items.ts` so the data layer can be swapped or extended in one place.

### Decision 2: Async data operations with pub/sub reactivity

All CRUD functions (`createItem`, `updateItem`, `deleteItem`) are async — they await Supabase responses before resolving. A `Set<() => void>` listener pool provides synchronous pub/sub so the `useItems()` hook can refetch after any mutation without requiring a full route reload.

### Decision 3: Realtime subscriptions for instant cross-device updates

The `useItems()` hook subscribes to Supabase Realtime `postgres_changes` on the `items` table. When any client inserts, updates, or deletes a row, every connected browser refetches automatically. This means if a student marks an item as returned on their phone, everyone else's dashboard updates instantly.

### Decision 4: Snake_case in the database, camelCase in the app

The Supabase table uses PostgreSQL conventions (`date_occurred`, `contact_instructions`, `is_demo`). A `rowToItem()` / `itemToRow()` mapping layer in `items.ts` converts between the two so the rest of the app works with clean TypeScript interfaces.

### Decision 5: Derivation pipeline — search → filter → sort

`filterItems()` is a pure function that takes an `Item[]` and a `Filters` object, then: (1) splits the search query into terms and requires all to match across title/description/location/category, (2) applies status/category/location equality filters, (3) sorts by `createdAt`. This keeps all derivation logic testable in isolation and out of the component tree.

### Decision 6: Calculations isolated in a pure-function module

The `recoveryRate()` function is a pure derivation: it takes `Item[]`, counts lost-type items, counts how many of those are returned, and returns a percentage. It lives in `items.ts` alongside the data model so domain logic is centralized.

### Decision 7: Zod for validation with a single schema

One `itemInputSchema` validates every field in the report/edit form. Zod's `.safeParse()` returns structured issues that the form maps to per-field error messages. The `ItemInput` type is inferred from the schema, so the form output and the validation rules can never drift.

### Decision 8: One reusable form for report and edit

`ItemForm` accepts `initial`, `submitLabel`, and `onSubmit` props. The report page passes `{ type }` as initial; the edit page passes the full item. Both call the same Zod schema and the same error-display helpers, so validation behavior is identical across create and update.

### Decision 9: Delete confirmation dialog

Deleting a listing requires an `AlertDialog` confirmation. The dialog explains that marking returned is preferable for items that were reunited, nudging users toward preserving history rather than deleting.

### Decision 10: Returned items stay visible in History

Marking an item as returned changes `status` to `"returned"` on the same row — it does not create a duplicate or delete the original. The History page shows all returned items with the status filter locked, so they remain accessible and searchable.

### Decision 11: Status changes update the existing record

`updateItem()` sends a Supabase `UPDATE` on the existing row. Editing the `type` of an active (non-returned) item syncs `status` to match, but a returned item stays returned unless explicitly reopened. No duplicates are ever created.

### Decision 12: Client-side validation with a pure function

Zod validation runs entirely on the client before any network request. The form focuses the first invalid field, shows inline error messages, and blocks submission until all fields pass. This prevents invalid data from reaching the database.

### Decision 13: ISO date strings, no timezone conversion

Dates are stored as `YYYY-MM-DD` strings (the HTML date input format). `formatDate()` appends `T12:00:00` to avoid midnight timezone shifts. The `dateOccurred` field is validated against `todayISO()` to prevent future dates.

### Decision 14: Recovery rate as a derived KPI

The dashboard shows the percentage of lost-type items that have been marked returned. This is computed client-side from the items array — it's a motivating metric for students to mark items as returned when reunited.

### Decision 15: Color system per status type

The Tailwind theme defines semantic colors for `lost` (blue), `found` (green), and `returned` (amber) statuses. Each has a soft background variant for badges. Status badges, filter pills, and form type selectors all use this consistent mapping.

### Decision 16: Slate-based neutral palette

The design system uses a slate-based neutral palette for backgrounds, borders, and text, with a deep navy primary color. This gives the app a premium, institutional feel appropriate for a campus utility.

### Decision 17: Responsive grid — 1 / 2 / 3 columns

Item cards render in a CSS grid: 1 column on mobile, 2 on tablet (`sm:`), 3 on desktop (`lg:`). Filters collapse from a 4-column row to a 2-column row on mobile. The hero section stacks on small screens.

### Decision 18: Sticky header navigation

A sticky top header with backdrop blur keeps the logo, browse/history links, and "Report item" button always accessible. On mobile, the browse link hides and the history link shows as an icon.

### Decision 19: Empty-state and loading-state components at every data boundary

`CardSkeletons` shows animated placeholders while items load. `ItemBrowser` shows a "No matching items" state with a reset-filters button when search/filters return nothing. `NotFoundItem` handles missing items on detail and edit pages. The dashboard shows "–" for counts while loading.

### Decision 20: @/ path alias

The `@/*` alias maps to `src/*` in both `tsconfig.json` and the Vite config, so imports are clean and stable regardless of file depth.

### Decision 21: Image handling with client-side resize

Photos are resized to max 900px and compressed to JPEG quality 0.75 in the browser before being stored as data URLs. Files over 10MB are rejected, and non-image types are rejected. A safety warning reminds users not to photograph IDs or personal documents.

### Decision 22: Demo seeding on first load

If the `items` table is empty, six realistic demo items (water bottle, calculator, backpack, notebook, keys, hoodie) are inserted with `is_demo: true`. These are labelled with a "Demo" badge on cards and the detail page so real reports are visually distinct.

### Decision 23: Single-tenant RLS with no auth

Because there are no accounts, RLS policies allow `anon, authenticated` full CRUD. This is intentional for a shared campus board — anyone can report, browse, and manage listings. The trade-off (no per-user ownership) is documented in the DemoNotice component.

---

## File-by-File Breakdown

### `src/lib/supabase.ts`
Supabase client singleton. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env. Session persistence is disabled since there's no auth.

### `src/lib/items.ts`
The domain core. Exports:
- Types: `Item`, `ItemInput`, `Category`, `ItemType`, `ItemStatus`, `Filters`
- Constants: `CATEGORIES`, `defaultFilters`
- Schema: `itemInputSchema` (Zod)
- Pure functions: `filterItems()`, `recoveryRate()`, `formatDate()`, `todayISO()`
- Async CRUD: `fetchItems()`, `createItem()`, `updateItem()`, `deleteItem()`, `resetDemo()`
- React hook: `useItems()` — returns `{ items, error, loading }`, subscribes to pub/sub + Realtime
- Image helper: `fileToDataUrl()` — client-side resize and compress
- Seeding: `seedIfEmpty()` — inserts 6 demo items if the table is empty

### `src/lib/items.test.ts`
Vitest unit tests for `filterItems` (search, filter combos, sorting), `itemInputSchema` (rejection, acceptance, future dates), and `recoveryRate` (empty, percentage, found-item exclusion).

### `src/lib/utils.ts`
`cn()` — Tailwind class merge helper (clsx + tailwind-merge).

### `src/lib/error-capture.ts`
Wraps `console.error` and global error listeners to capture and recover original error stacks that the SSR runtime swallows into generic 500s.

### `src/lib/error-page.ts`
`renderErrorPage()` — returns a self-contained HTML error page with "Try again" and "Go home" buttons.

### `src/lib/lovable-error-reporting.ts`
Forwards error-boundary catches to the Lovable editor's telemetry hooks. Only active inside the Lovable preview environment.

### `src/router.tsx`
`getRouter()` — builds the TanStack Router instance with a QueryClient context.

### `src/routeTree.gen.ts`
Auto-generated route tree wiring 5 routes under the root. Do not edit.

### `src/server.ts`
SSR server entry for Nitro/Cloudflare. Wraps the TanStack Start server entry and replaces catastrophic 500 responses with the friendly HTML error page.

### `src/start.ts`
TanStack Start config with error middleware and CSRF protection on server functions.

### `src/styles.css`
Tailwind v4 theme: oklch color tokens for primary, lost, found, returned, accent, surface, and neutral scales. Font families (Manrope, Space Grotesk). Shadow and radius tokens.

### `src/routes/__root.tsx`
Root layout — HTML shell, head metadata, Google Fonts, error and 404 boundaries, QueryClientProvider, and the Sonner toaster.

### `src/routes/index.tsx`
Home dashboard — hero, summary counts, recovery rate KPI, recently reported items via `ItemBrowser`, and the "how to get your things back" guide.

### `src/routes/report.tsx`
Report form — validates `?type=` search param, renders `ItemForm`, calls `createItem()` on submit, navigates to the new item's detail page.

### `src/routes/items.$id.tsx`
Item detail — photo, status badge, metadata, contact instructions, owner actions (mark returned/reopen, edit, delete with confirmation). Exports `NotFoundItem` for reuse.

### `src/routes/edit.$id.tsx`
Edit form — loads item by ID, pre-fills `ItemForm`, calls `updateItem()` on submit, navigates back to detail.

### `src/routes/history.tsx`
Returned history — renders `ItemBrowser` with `initial={{ status: "returned" }}` and `lockStatus` so the status filter is hidden and locked.

### `src/components/lf/Browser.tsx`
`ItemBrowser` — search input, status/category/location/sort selects, live result count, clear/reset filters, skeleton loading state, empty state, responsive card grid.

### `src/components/lf/ItemForm.tsx`
`ItemForm` — controlled form with lost/found radio buttons, all field inputs, Zod validation on submit, per-field inline errors, image upload with resize, safety warning, submit button with loading state.

### `src/components/lf/ui.tsx`
Shared UI primitives:
- `categoryIcon` — maps categories to Lucide icons
- `StatusBadge` — colored pill with status label
- `ItemImage` — photo or gradient placeholder with category icon
- `ItemCard` — link card for grid display (never shows contact info)
- `SiteHeader` — sticky navigation bar
- `DemoNotice` — info banner about the shared board model
- `PageShell` — header + main + footer wrapper
- `CardSkeletons` — animated loading placeholders

### `src/hooks/use-mobile.tsx`
`useIsMobile()` — matchMedia listener at 768px breakpoint.

### `src/test/app-routing.test.tsx`
Routing smoke test — builds the router and verifies a real page matches `/`.

### `src/test/setup.ts`
Vitest setup — jest-dom matchers, scrollTo/matchMedia polyfills for jsdom.

---

## Data Model

### TypeScript interface (app layer)

```typescript
interface Item {
  id: string;              // UUID (gen_random_uuid())
  title: string;           // 3–80 chars
  description: string;     // 10–1000 chars
  category: Category;      // 8 enum values
  location: string;        // 2–100 chars
  dateOccurred: string;    // YYYY-MM-DD
  image: string | null;    // JPEG data URL or null
  type: "lost" | "found";
  status: "lost" | "found" | "returned";
  contactInstructions: string;  // 5–300 chars
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  isDemo?: boolean;        // true for seeded demo items
}
```

### Database table (Supabase)

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `title` | text | NOT NULL |
| `description` | text | NOT NULL |
| `category` | text | NOT NULL, CHECK enum |
| `location` | text | NOT NULL |
| `date_occurred` | date | NOT NULL |
| `image` | text | nullable |
| `type` | text | NOT NULL, CHECK (`lost`/`found`) |
| `status` | text | NOT NULL, CHECK (`lost`/`found`/`returned`) |
| `contact_instructions` | text | NOT NULL |
| `is_demo` | boolean | NOT NULL, default false |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

### RLS policies

All four CRUD operations are open to `anon, authenticated` because this is a shared board with no accounts:

| Policy | Command | Role | Predicate |
|---|---|---|---|
| `anon_select_items` | SELECT | anon, authenticated | `USING (true)` |
| `anon_insert_items` | INSERT | anon, authenticated | `WITH CHECK (true)` |
| `anon_update_items` | UPDATE | anon, authenticated | `USING (true) WITH CHECK (true)` |
| `anon_delete_items` | DELETE | anon, authenticated | `USING (true)` |

### Indexes

- `idx_items_status` — on `status` (dashboard counts, status filter)
- `idx_items_created_at` — on `created_at DESC` (recent items, sort)
- `idx_items_category` — on `category` (category filter)
- `idx_items_type` — on `type` (lost/found filter)

---

## Getting Started

The project uses npm. Dependencies are already installed.

```sh
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run test     # run tests
npm run lint     # lint
```

Environment variables for Supabase are pre-populated in `.env`:
- `VITE_SUPABASE_URL` — project URL
- `VITE_SUPABASE_ANON_KEY` — anon public key

No additional configuration is needed.

---

## What Comes Next

Potential future improvements:

- **User accounts** — add Supabase auth so each student owns their listings, with per-user RLS policies.
- **Image storage** — move photos from data URLs to Supabase Storage buckets for better performance and size limits.
- **Claim workflow** — a "I think this is mine" flow that contacts the reporter without exposing contact info.
- **Notifications** — email or push notifications when a matching found item is reported for a lost item.
- **Admin moderation** — a role-based moderator panel to remove inappropriate listings.
- **Search by date range** — add a date picker filter to narrow results to a specific window.
- **Export** — download the returned-history as CSV for campus admin reporting.
