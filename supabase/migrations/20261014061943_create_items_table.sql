/*
# Create items table for Campus Lost & Found

1. New Tables
- `items` — stores lost & found reports submitted by students.
  - `id` (uuid, primary key, defaults to gen_random_uuid())
  - `title` (text, not null, 3–80 chars enforced by app validation)
  - `description` (text, not null, 10–1000 chars enforced by app validation)
  - `category` (text, not null, one of: Electronics, Stationery, Bags, Clothing, Accessories, Water Bottles, Documents, Other)
  - `location` (text, not null, 2–100 chars)
  - `date_occurred` (date, not null) — the date the item was lost or found
  - `image` (text, nullable) — data URL of resized photo or null
  - `type` (text, not null) — 'lost' or 'found'
  - `status` (text, not null, default matches type) — 'lost', 'found', or 'returned'
  - `contact_instructions` (text, not null) — safe contact method (no raw phone/email)
  - `is_demo` (boolean, default false) — flags seeded demo content
  - `created_at` (timestamptz, defaults to now())
  - `updated_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on `items`.
- This is a single-tenant, no-auth campus board: all students share the same
  set of items. Policies allow anon + authenticated full CRUD because the
  data is intentionally public/shared (anyone can report, browse, and update
  status — this is the documented demo model).

3. Indexes
- `idx_items_status` on `status` — dashboard counts and status filtering
- `idx_items_created_at` on `created_at DESC` — recent-items and sort
- `idx_items_category` on `category` — category filter
- `idx_items_type` on `type` — lost/found filtering

4. Important Notes
- The app uses the Supabase anon key (no sign-in), so every policy must
  include `anon` or the app will see an empty table.
- `status` defaults to the value of `type` on insert via the app layer.
- Returned items remain in the table (not deleted) so the history page
  can display them.
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (
    category IN ('Electronics','Stationery','Bags','Clothing',
                 'Accessories','Water Bottles','Documents','Other')
  ),
  location text NOT NULL,
  date_occurred date NOT NULL,
  image text,
  type text NOT NULL CHECK (type IN ('lost','found')),
  status text NOT NULL DEFAULT 'lost' CHECK (status IN ('lost','found','returned')),
  contact_instructions text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_items" ON items;
CREATE POLICY "anon_select_items"
  ON items FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_items" ON items;
CREATE POLICY "anon_insert_items"
  ON items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_items" ON items;
CREATE POLICY "anon_update_items"
  ON items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_items" ON items;
CREATE POLICY "anon_delete_items"
  ON items FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_type ON items (type);
