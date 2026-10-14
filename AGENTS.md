<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Item data lives in Supabase (PostgreSQL) via src/lib/items.ts; all reads/writes go through its async functions (fetchItems, createItem, updateItem, deleteItem) and the useItems() hook. The Supabase client is in src/lib/supabase.ts. Realtime subscriptions push updates to all connected clients instantly.
