# AI guide for this repo (Zentao Raycast Extension)

Be productive quickly with these repo-specific rules. Follow existing patterns and verify behavior in Raycast.

## What this is
- A Raycast extension to list and complete Zentao tasks.
- The “manifest” is `package.json` (commands, preferences, metadata).

## Dev flows
- Dev: `npm run dev` (Raycast Develop).
- Build: `npm run build`.
- Lint: `npm run lint` or `npm run fix-lint` (extends `@raycast/eslint-config`).
- Publish to Raycast Store: `npm run publish` (do not publish to npm).

## Architecture
- Entry command: `src/search-my-tasks.tsx` → reads `Preferences`, loads tasks via `fetchTasksFromZentao()`, renders a `List` with sort actions and pushes `TaskDetail`.
- Detail: `src/components/TaskDetail.tsx` → shows tags (status, priority), links to Zentao, can push `FinishTaskForm` if not done/closed.
- Finish: `src/components/FinishTaskForm.tsx` → `react-hook-form`; preloads `uid` + members via `fetchTaskFormDetails(task.id)`; submits via `finishTask(params)`.
- Networking & parsing: `src/utils/taskService.ts` (single source for HTTP + Cheerio parsing).
  - Task list parsing (`parseTasksFromHtml`): selectors like `.c-name a`, `.c-status .status-task`, `.c-project a`, `.c-hours`.
  - Finish form parsing (`parseTaskFormDetails`): `#assignedTo option` and script var `kuid` → `uid`.
  - Finish submit (`finishTask`): POST `FormData` to `task-finish-<id>.html?onlybody=yes`; success iff body includes `parent.parent.location.reload()`; `alert('...')` indicates server error.
  - Debug logs: HTML/response written under `log/` (and `my-task.html` near build output from `__dirname`).

## Models, visuals, i18n
- Types in `src/types/*`. `Task` ties to `TaskStatus` / `TaskPriority` in `src/constants/*` (priority values are strings "1".."4", smaller=high).
- Use helpers for visuals: `getStatusIconConfig`, `getStatusLabel`, `getPriorityIcon`, `getPriorityColor`, `getPriorityLabel`; colors from `TAILWIND_COLORS`.
- i18n via `src/utils/i18n.ts` with `t(key, replacements?)`; language from preferences (`language`), cache reset with `resetLanguageCache()`.

## Adding features (do it this way)
- New command: create `src/<name>.tsx` (default export component) and register under `package.json > commands`.
- New scraping: add a `parse*FromHtml()` in `taskService.ts` and keep UI dumb (no DOM knowledge in components).
- Dates/sorting: use `dayjs`; provide valid strings (e.g., `YYYY-MM-DD HH:mm`).

## Integration gotchas
- Always send cookie `zentaosid` and `za=<username>` (see headers in `taskService`).
- Treat HTTP 200 without `parent.parent.location.reload()` as failure for finish.
- Large logs shouldn’t ship to the Store.

Questions or divergences (selectors, status texts, logging paths)? Ask to refine this doc.
