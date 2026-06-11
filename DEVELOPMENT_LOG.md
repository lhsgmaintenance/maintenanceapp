# LHSG Maintenance App - Development Log

Every Codex change should add a short dated entry to this file.

## Entry Template

```markdown
## YYYY-MM-DD - Short Task Name

- Task:
- Files changed:
- Test result:
- Next step:
```

## 2026-05-20 - Documentation Baseline

- Task: Created project documentation files for future Codex work.
- Files changed: `AGENTS.md`, `DESIGN.md`, `ROADMAP.md`, `TESTING_CHECKLIST.md`, `DEVELOPMENT_LOG.md`.
- Test result: Documentation-only change; app logic was not modified.
- Next step: Review the documentation, then test future app changes with the manual checklist.

## 2026-05-20 - UI/UX Refinement

- Task: Refined the static PWA interface with cleaner mobile-first layout, premium cards, improved buttons, subtle micro-interactions, selected-card highlighting, and a styled destructive confirmation dialog.
- Files changed: `styles.css`, `index.html`, `app.js`, `DEVELOPMENT_LOG.md`.
- Test result: `node --check app.js` passed. Static server smoke test at `http://127.0.0.1:8000` loaded the dashboard, opened/closed the profile dialog, showed no startup error, found no browser console errors, confirmed reduced-motion CSS is present, and checked a 390px mobile viewport with no visible UI text below 13px.
- Next step: Manually test login, task create/edit/delete, routine delete, notifications, and PWA behavior using `TESTING_CHECKLIST.md`.

## 2026-05-20 - Local Server Documentation

- Task: Updated documentation to use `npx http-server . -p 8000 -c-1` as the preferred local static server command, with `npx serve . -l 8000` as the alternative.
- Files changed: `AGENTS.md`, `TESTING_CHECKLIST.md`, `DEVELOPMENT_LOG.md`.
- Test result: Documentation-only change; app logic was not modified.
- Next step: Use the documented `npx` static server command for future local testing.

## 2026-05-20 - Modal Viewport Fix

- Task: Fixed tall modal layout so New Work Order and New Routine forms fit within the viewport and keep submit buttons reachable.
- Files changed: `styles.css`, `index.html`, `DEVELOPMENT_LOG.md`.
- Test result: Browser smoke test passed for New Work Order and New Routine at 1280x720 and 390x844. Both dialogs stayed within the viewport, used internal form scrolling, kept sticky header/footer visible, kept submit buttons reachable, locked page-behind scrolling, and produced no browser console errors.
- Next step: Continue UI testing once task and routine creation dialogs are usable.

## 2026-05-20 - Mobile Navigation Refinement

- Task: Replaced the tall mobile sidebar navigation with a compact bottom app navigation and More panel for secondary/admin views.
- Files changed: `index.html`, `styles.css`, `app.js`, `DEVELOPMENT_LOG.md`.
- Test result: `node --check app.js` passed. Browser smoke test at 390x844 confirmed compact mobile nav, Dashboard/Work/Routine/Admin navigation, More panel behavior, no visible nav text below 13px, and New Work Order/New Routine modals still scroll with reachable buttons. Desktop 1280x720 kept the sidebar navigation. Work order and routine creation were smoke-tested through the existing forms. No browser console errors were reported.
- Next step: Continue mobile UI testing after confirming navigation, creation dialogs, and PWA files remain stable.

## 2026-06-05 - Routine Checklist Carryover Fix

- Task: Fixed routine-generated work orders so checklist items from the source routine are preserved when the prefilled work order form is saved.
- Files changed: `app.js`, `DEVELOPMENT_LOG.md`.
- Test result: `node --check app.js` passed. Manual browser testing still needed for routine creation, generated work order checklist display, unchecked defaults, details-only routines, existing work orders, and console errors.
- Next step: Manually test routine checklist creation, today's work order generation, unchecked checklist defaults, details-only routines, and old work order rendering before committing.

## 2026-06-05 - Checklist Assignee Fix

- Task: Fixed the changed-assignee path for routine-generated work orders so changing the assignee only changes assignee fields and does not drop the source routine checklist.
- Issue found: routine-to-work-order mapping depended on a narrow `routine.checklist` shape; changed-assignee saves could rebuild the new work order payload without a resilient checklist fallback.
- Files changed: `app.js`, `index.html`, `sw.js`, `version.json`, `DEVELOPMENT_LOG.md`.
- Test result: `node --check app.js` passed. Automated checks confirmed syntax only; manual browser test cases for user A, user B, user C, assignee correctness, duplicate prevention, old task rendering, and console errors still need to be completed against local/live data.
- Next step: Run `npx http-server . -p 8000 -c-1`, test routine-generated work orders with original and changed assignees, then commit and push after confirming on devices.

## 2026-06-08 - Report Close Button

- Task: Added a visible, accessible Close button to the completion report shown after work task submission.
- Issue found: the completion report opened in a separate browser window with only a Save / Print PDF action, leaving no clear way to close it and return to the completed Work Task.
- Files changed: `app.js`, `index.html`, `sw.js`, `version.json`, `DEVELOPMENT_LOG.md`.
- Close behavior: Close focuses the original app window when available and closes only the generated report window; it does not submit again or clear submitted report data.
- Test result: `node --check app.js` passed; version and cache consistency checks passed. Static browser test cases completed at desktop and mobile widths: submit report, report appears, Close is visible, Close returns to the original Work Orders screen, no duplicate submission, and no console errors.
- Next step: Confirm the workflow with the live Google backend and installed PWA before committing and pushing.

## 2026-06-08 - Version Label v1.4.9

- Task: Updated the visible app version label and related version/cache identifiers to `v1.4.9`.
- Files changed: `index.html`, `app.js`, `version.json`, `sw.js`, `DEVELOPMENT_LOG.md`.
- Test result: Version consistency and JavaScript syntax checks passed.

## 2026-06-08 - Completed Record Data Safety

- Issue found: admin asset/routine saves, deletes, and imports used the `saveAll` backend action, which could replace Google Sheets data with a partial frontend dataset and remove completed maintenance records that were not currently loaded.
- Files changed: `app.js`, `index.html`, `sw.js`, `version.json`, `DEVELOPMENT_LOG.md`.
- Fix: removed all frontend `saveAll` calls; work tasks continue using row-specific `upsertOrder`. Asset/routine cloud saves and deletes now fail closed because their row-specific backend handlers cannot be verified, with no bulk-write fallback.
- Completed record protection: ordinary edits to completed work orders are blocked, imports preserve existing completed records and remain local-only, and deletes require two confirmations including an export-backup warning.
- Debugging: row-specific remote mutations and delete requests log only action, record type, and stable ID.
- Test result: JavaScript/JSON syntax and no-`saveAll` static checks passed. Mocked browser tests confirmed report submission sends only one `upsertOrder`, preserves unrelated completed records, blocks completed-record edits, preserves existing records during additive import, and requires two delete confirmations. Final static assertions confirm unverified admin actions return before `postRemote`.
- Backend deployment note: the Google Apps Script source is not present in this repository. Its deployed handlers must implement and advertise `upsertAsset`, `upsertRoutine`, `deleteOrder`, and `deleteRoutine` as row-specific operations and must reject `saveAll` for production data before those cloud actions are enabled.
