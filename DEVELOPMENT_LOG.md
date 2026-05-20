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
