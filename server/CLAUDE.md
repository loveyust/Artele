# Server — Claude Code Guide

See root `CLAUDE.md` for full architecture overview.

## Server Structure
```
server/src/
  socket.server.js       — Express + Socket.io, all event handlers
  data.service.js        — Singleton: image fetching, pool loading, history, timers
  scheduler.controller.js — node-schedule jobs for wake/sleep automation
  receiver.controller.js  — Onkyo receiver (IP) + TV (HDMI CEC) control
  config.js              — Environment config
  db/
    database.js          — SQLite init, schema, seed data
```

## DataService Singleton
One instance shared across the app. Key state:
- `airTableData[]` — loaded sources with `objectIDsArray` populated
- `curImageObject` — last emitted image data
- `imageHistory[]` — 30-item history buffer
- `historyIndex` — current position in history
- `dataLoaded` — false until all source pools are ready
- `settings` — current settings (timePerArtwork, paused, schedules)

## Pool Loading Sequence
```
loadData()
  → loadMuseum(0)
    → if has departmentIDs: loadObjectsByDepartment()
      → fetch dept API (paginates all departmentIDs)
      → extract ID field from each row
      → shuffle, take top 100 per page
      → saveObjectIDs() → write to SQLite
      → loadNextMuseum()
    → else: use pre-cached objectIDs from DB
  → loadMuseum(1) ... loadMuseum(n)
  → dataLoaded = true
  → makeRegisteredCallbacks()
  → getRandomImage(true)  ← starts the image cycle
```

## URL Placeholder Convention
- `ObjectID` — replaced with the object's ID (URL-encoded, colons preserved)
- `DepartmentID` — replaced with each department offset for pagination
- `AccessToken` — replaced with `sources.accessToken` if not null/undefined

## Field Path Traversal
Implemented in `processElementArray` + `returnElement`:
- Comma-separated path strings navigate nested JSON
- `key[]` or `key[n]` — array access (n=0 by default)
- If any step in the path is undefined, returns `defaultElement`

## Adding a New Source
1. Add a row to the `sources` seed in `db/database.js`
2. Run `clearImageData()` or clear the DB to trigger a pool reload
3. Test using the mobile UI test button before enabling in rotation

## SQLite Notes
- `better-sqlite3` (synchronous API — no async/await needed)
- WAL mode enabled for concurrent reads
- DB path: `../data/artele.db` relative to `server/src/`
- Seed only runs if tables don't exist yet

## Scheduler
- Uses `node-schedule` cron jobs
- 4 jobs per day-type (weekday/weekend): amOn, amOff, pmOn, pmOff
- amOn/pmOn → screenWake (device control mostly stubbed)
- amOff/pmOff → screenSleep
- `findCurrentMode()` determines active state on startup

## Receiver Controller
- Onkyo control via `onkyo.js` over IP (requires `RECEIVER_ENABLED=true` + `RECEIVER_IP`)
- TV control via `cec-controller` (requires `CEC_ENABLED=true`, platform-dependent)
- Both are optional; app works without them
