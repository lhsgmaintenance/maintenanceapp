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
