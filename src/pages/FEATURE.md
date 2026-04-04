# Pages

Route-level page components. Each page is a top-level route in `App.tsx`.

## Entrypoints

- **`SlopcastPage.tsx`** (877 LOC) — Main workspace. Orchestrates wells/economics tabs, map, sidebar. Uses `useSlopcastWorkspace` for all state. Read in chunks (offset/limit).
- **`HubPage.tsx`** — Deal hub / landing page
- **`IntegrationsPage.tsx`** (543 LOC) — Databricks/external data connections
- **`AuthPage.tsx`** — Login/signup, delegates to auth adapter

## Key Dependencies

- `SlopcastPage` → `useSlopcastWorkspace` (hooks/) → `projectRepository` (services/)
- `SlopcastPage` → `MapCommandCenter` (components/slopcast/)
- Router config lives in `App.tsx` (one level up)

## Avoid These False Starts

- Don't look for page-level state in the page file — it's all in `useSlopcastWorkspace`
- Don't add new top-level state to SlopcastPage — extend the workspace hook instead
