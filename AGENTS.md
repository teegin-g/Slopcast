# Slopcast Agent Notes

## UI/UX Edits Workflow (Storybook MCP + Playwright MCP)

When making any visual/layout/style change:

1. Start the app (`npm run dev`) and Storybook (`npm run storybook`). Storybook serves MCP at `http://localhost:6006/mcp` while the dev server is running.
2. For reusable UI component work, use Storybook MCP before taking action:
 - Query `list-all-documentation` to find existing documented components and stories.
 - Query `get-documentation` or `get-documentation-for-story` before assuming props, states, or composition patterns.
 - Query `get-storybook-story-instructions` before creating or rewriting stories.
 - Run `run-story-tests` after updating component stories when the MCP server is available.
3. Keep Storybook and the app in sync:
 - Create or update colocated `*.stories.tsx` files for reusable UI touched under `src/components/`.
 - Run `npm run ui:components` to validate Storybook build + story tests.
4. Use the `playwright` MCP server for integrated app checks:
 - Capture screenshots (desktop + mobile) before and after.
 - Check both view modes (`ANALYSIS` and the main builder view).
 - Check at least two themes (`slate` and `mario`) to catch token and contrast regressions at the page level.
5. Fix inconsistencies by aligning everything to the container primitives:
 - Prefer `rounded-panel` for outer cards and `rounded-inner` for nested tiles.
 - Avoid reintroducing `rounded-2xl`, `rounded-xl`, `shadow-xl`, or `sc-titlebar--brown`.
6. Run `npm run ui:audit` and `npm run ui:verify` before closing out the change.

If Storybook MCP is unavailable, fall back to reading the colocated stories directly and keep `npm run ui:components` in the validation loop. If Playwright MCP is unavailable, fall back to screenshotting via the browser devtools and keep the `ui:audit` / `ui:verify` checks.

