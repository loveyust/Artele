# Artele — Claude Code Guide

## What This App Is
A gallery control system with two screens:
- **Display** (`/display`) — Full-screen 1920×1080 art gallery view, runs on the physical screen
- **Mobile UI** (`/`) — Control panel for playback, scheduling, and source management

Both connect to a Node.js socket server (port 3001). The server fetches artwork from external museum APIs, analyzes image colors, and pushes image data to all connected clients in real time.

## Architecture

```
React Client (port 3000)
  ├── /display        → Display.js       — gallery screen, listens for images
  └── /              → Artele.js        — mobile control panel

Socket Server (port 3001)
  ├── socket.server.js   — event routing
  ├── data.service.js    — image fetching, history, timers, DB writes
  ├── scheduler.controller.js — schedule-based automation
  ├── receiver.controller.js  — Onkyo receiver + TV (CEC) control
  └── db/database.js     — SQLite schema + seed data
```

## Running the App
- Node v20 required
- Client: `npm start` from root (port 3000)
- Server: `npm start` from `server/` (port 3001)
- Kill both ports: `lsof -ti :3000 -ti :3001 | xargs kill -9`

## Socket Event Reference

### Client → Server
| Event | Payload | Effect |
|---|---|---|
| `request_random_image` | — | Fetch and push new image |
| `request_next_image` | — | Advance forward or fetch new |
| `request_prev_image` | — | Go back in 30-item history |
| `request_set_paused` | bool | Pause/resume auto-advance timer |
| `request_set_time` | seconds | Change artwork display duration |
| `request_set_active` | `{active, id}` | Toggle source in rotation |
| `request_set_schedule` | `{day, data}` | Update weekday/weekend schedule |
| `request_save_image` | — | Post current image to Slack |
| `request_museum_data` | — | Fetch all source configs |
| `request_settings_data` | — | Fetch settings |
| `request_save_source` | sourceData | Create or update a source |
| `request_delete_source` | id | Delete a source |
| `request_test_source` | `{objectAPI, sampleId, accessToken}` | Test an object API URL |
| `request_clear_source_ids` | id | Clear cached object IDs for a source |
| `request_images_update` | — | Clear all pools and reload from APIs |

### Server → Client
| Event | Payload |
|---|---|
| `send_random_image` | `{image, title, artist, date, medium, museumName, objectID, matColor, textColor}` |
| `send_museum_data` | Array of source configs |
| `send_settings_data` | Settings object |
| `send_test_result` | Raw API response |
| `send_random_image_error` | `{message}` |

## Image Pipeline (server)
1. Pick random active source → random object ID from pool
2. Fetch object metadata from `objectAPI` URL
3. Traverse nested JSON using comma-separated field paths
4. Validate image URL exists (string); skip and retry if not
5. Fetch image into Buffer → ColorThief extracts dominant palette
6. Use 2nd palette color as mat color; YIQ contrast → text color (black/white)
7. Push to 30-item history; emit `send_random_image` to all sockets
8. Start/restart auto-advance timer

## Field Path Syntax
Paths are comma-separated JSON keys stored in the database (e.g. `response,content,freetext,name[],content`).
- `key` — access object property
- `key[]` or `key[0]` — first item of array
- `key[n]` — nth item of array (added; backward compatible)

Example: `response,content,descriptiveNonRepeating,title,content`
→ `data.response.content.descriptiveNonRepeating.title.content`

## Database
- SQLite at `data/artele.db` (gitignored)
- Schema seeded in `server/src/db/database.js`
- Two tables: `settings` (singleton, id=1) and `sources`

### sources table columns
```
id, name, active, accessToken,
departmentIDs,          -- comma-separated page offsets (e.g. "0,100,200")
departmentObjectAPI,    -- URL template; DepartmentID and AccessToken are placeholders
departmentArray,        -- path to array in dept API response (e.g. "response,rows")
departmentObjectField,  -- path to object ID field in each row (e.g. "url")
objectAPI,              -- URL template; ObjectID and AccessToken are placeholders
imageField, titleField, artistField, dateField, mediumField,  -- field paths
objectIDs               -- comma-separated cached IDs (null = needs pool refresh)
```

## Key Behaviors
- **Pool refresh**: `request_images_update` clears all `objectIDs` and re-fetches from department APIs on server restart.
- **objectIDs caching**: Once fetched, object IDs are saved to SQLite. They persist across restarts unless cleared.
- **Access token**: Stored in `sources.accessToken`. Replaces the literal string `AccessToken` in URL templates. If null/undefined, the placeholder is NOT replaced.
- **URL encoding**: Object IDs are `encodeURIComponent`-encoded when inserted into URLs, but colons (`:`) are preserved (Smithsonian EDAN IDs use `edanmdm:nasm_XXXX` format).
- **Skip on no image**: If an object has no valid image URL, `getRandomImage` calls itself recursively to try another.
- **History**: 30-item circular buffer; `getPrevImage`/`getNextImage` navigate it; branching mid-history truncates forward history.

## Active Sources (as of setup)
| Name | API | Notes |
|---|---|---|
| Cooper Hewitt | Cooper Hewitt API | Requires access token |
| The Met | metmuseum.org API | Public, large pool |
| NASA Apollo | NASA Images API | Direct object IDs (no pool fetch) |
| Smithsonian NASM | Smithsonian Open Access API | NASM unit only; EDAN IDs use `edanmdm:` prefix |
| NASA Aurora | NASA Images API | Direct object IDs |

## Smithsonian NASM Notes
- Filter must use `q=unit_code%3ANASM%20AND%20online_media_type%3AImages` in the main query param — NOT `fq=` (broken in their API)
- Object IDs are in `url` field of search results (e.g. `edanmdm:nasm_A19820121000`)
- Object API: `https://api.si.edu/openaccess/api/v1.0/content/ObjectID?api_key=AccessToken`
- Title: `response,content,descriptiveNonRepeating,title,content`
- Image: `response,content,descriptiveNonRepeating,online_media,media[],content`
- Medium (Summary): `response,content,freetext,notes[1],content`

## Config (server/src/config.js)
- `SOCKET_PORT` — default 3001
- `CORS_ORIGINS` — default `http://localhost:3000`
- `SLACK_TOKEN` — for saving images
- `RECEIVER_ENABLED`, `RECEIVER_IP` — Onkyo receiver control
- `CEC_ENABLED` — HDMI CEC TV control

## Design System
- Background: `#1A2730` dark teal
- Card surface: `#EDE8DC` cream
- Accent: `#E95D2C` orange
- Mat color: dynamic (from ColorThief)
- Fonts: Montserrat, Courier New (data labels), Helvetica Neue 900 (titles)
