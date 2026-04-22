# Test Plan — Battle Map + Aesthetics + Review Fixes (PR #1)

## What changed
- New **Battle Map** tab: Three.js globe with 49 account dots, 3 deployed (Goldman, Nubank, Infosys), hub arcs, ticker.
- 5 aesthetic items: dot-grid bg, two-colour Command header, coloured metric icon boxes, mono footer, `.source-pill` badges on Intelligence + Competition.
- Review fixes: competitor seed uses `INSERT OR IGNORE` (user battlecards persist); Outreach accepts `compose=<id>` param to auto-open composer with account pre-selected.

## Primary flow (recorded)
1. Command dashboard — verify header, metric icon boxes, dot-grid bg, footer.
2. Battle Map tab — verify globe renders, counter `49 accounts · 3 deployed`, Deployed-Only filter → `3 · 3`, hover tooltip, click Goldman → sidebar populated + ticker visible.
3. Click "Log Reach Out" in sidebar → Outreach page loads with composer modal open AND account dropdown pre-set to Goldman Sachs (the compose-param fix).
4. Intelligence + Competition — verify `.source-pill` mono badges visible on data source labels.

## Key assertions
- Command header shows `Cognition` (white) + `Revenue OS` (#3b82f6 blue).
- Each of 6 metric cards has a distinct coloured square icon box in the top-left.
- Battle Map counter text reads exactly `49 accounts · 3 deployed` on first paint.
- Clicking "Deployed Only" toggle → counter becomes `3 accounts · 3 deployed`.
- Hovering a dot shows a floating tooltip containing the company name.
- Clicking Goldman Sachs dot → left sidebar shows `GOLDMAN SACHS`, `Financial Services`, `40,000 engineers`, `ICP X/10`, with `View Account →` and `Log Reach Out` buttons.
- Clicking `Log Reach Out` → navigates to Outreach, composer modal is open, account dropdown displays `Goldman Sachs` (not empty).
- Ticker bar at bottom contains the exact text `GOLDMAN SACHS · DEVIN DEPLOYED IN-VPC · 3-4X VELOCITY · NEW YORK`.
- Intelligence Terminal shows at least one `.source-pill` chip (monospace, uppercase) like `HN · ALGOLIA`.
- Competition page shows a `.source-pill` chip on the HN feed block.
- Footer `Directed by Idel · Executed by Devin` visible on Command and Battle Map.

## Adversarial design
- A broken compose-param fix would show the composer with account dropdown empty → visible difference.
- A broken seed would show `46 accounts · 0 deployed` instead of `49 · 3`.
- A broken aesthetic would show plain text (no blue accent, no icon boxes).

## Evidence
- Single screen recording with `computer(action="record_annotate")` assertions at each check.
- Post consolidated PR comment with results table.
