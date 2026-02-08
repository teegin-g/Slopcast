# Slopcast Agent Notes

## UI/UX Edits Workflow (With Playwright MCP)

When making any visual/layout/style change:

1. Start the app (`npm run dev`) and keep it running at `http://localhost:3000`.
2. Use the `playwright` MCP server to:
   - Capture screenshots (desktop + mobile) before and after.
   - Check both view modes (`ANALYSIS` and the main builder view).
   - Check at least two themes (`slate` and `mario`) to catch token/contrast regressions.
3. Fix inconsistencies by aligning everything to the container primitives:
   - Prefer `rounded-panel` for outer cards and `rounded-inner` for nested tiles.
   - Avoid reintroducing `rounded-2xl`, `rounded-xl`, `shadow-xl`, or `sc-titlebar--brown`.
4. Run `npm run ui:audit` to catch style drift and forbidden classnames.

If Playwright MCP is unavailable, fall back to screenshotting via the browser devtools and keep the `ui:audit` checks.

