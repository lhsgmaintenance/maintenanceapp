# LHSG Maintenance App - Codex Instructions

This project is the LHSG Maintenance App, a static HTML/CSS/JavaScript progressive web app.

## Project Shape

- Static app only: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, icons, and supporting assets.
- This is not a React, npm, Vite, Next.js, or bundled frontend project.
- There is currently no `package.json`.
- Do not convert this app to React or introduce a build system unless the owner explicitly approves.

## Safe Working Rules

- Always inspect relevant files before editing.
- Preserve current functionality unless the task explicitly asks for behavior changes.
- Keep changes focused on the requested task.
- Do not run `npm install`.
- Do not run `npm run dev`.
- Do not add npm dependencies or generated package files unless explicitly approved.
- Use a simple static server for local testing.
- Do not use `python -m http.server`; the owner's Windows PC does not have Python installed.
- Avoid broad rewrites of `app.js`, `styles.css`, `sw.js`, or service worker behavior unless the task requires it.
- Be careful with PWA behavior, caching, push subscriptions, local storage, and Firebase/admin flows.

## Critical Data Safety Rules

- Google Sheet data is production data.
- Do not delete, clear, overwrite, or replace existing records unless the owner explicitly requests it.
- Completed maintenance records are production history and must be preserved.
- UI, cache, service worker, and version updates must never modify backend records.
- Every backend write change must target one row by a stable task ID or report ID.
- Do not use whole-sheet replacement, bulk clear, or filtered frontend data to rewrite backend records.
- If a proposed change may affect multiple backend rows, stop and explain the risk before editing or running it.

## Local Testing

Use this preferred static server command from the repository root:

```powershell
npx http-server . -p 8000 -c-1
```

Alternative:

```powershell
npx serve . -l 8000
```

Then open:

```text
http://localhost:8000
```

If port `8000` is busy, choose another available port.

## Task Completion Expectations

After each Codex task:

- Summarize every file created or changed.
- Summarize what was tested.
- Mention any test gaps or risks.
- Remind the owner to run `git add`, `git commit`, and `git push` after they have tested the changes.

## Live Repository

The live repository is:

```text
https://github.com/lhsgmaintenance/maintenanceapp.git
```
