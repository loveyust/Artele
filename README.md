# Artele

## Intro

App to display art museum content from various art museum and other content and image APIs (The Met, Cooper Hewitt, NASA, etc...).

Experience Architecture:
- **React app**: Runs the display interface (`/display`) and a mobile remote interface (`/`). Connected to the socket server via Socket.io.
- **SQLite CMS**: Stores sources (museum/image APIs), cached object ID pools, and persistent settings (time per artwork, schedule, active sources). Replaces the original Airtable integration. New sources can be added to the CMS using the UI.
- **Socket/data service (Node.js)**: Loads sources from SQLite, fetches artwork from museum APIs, schedules device behavior, and emits data to clients over websockets.
- **Raspberry Pi 4**: Runs the app in full screen, connected to a home A/V receiver for display on the TV. Communicates with an Onkyo TX-NR797 receiver to self-select as the source and turn on the TV on an automated schedule.


## React App Folder Structure

```
build/              # Production frontend build (served by socket server)
public/
src/                # Frontend source
  assets/           # Fonts
  components/       # UI elements (ToggleSwitch, TimePicker, FrameMat, ArtInfo, ...)
  containers/
    Artele/         # Mobile remote control UI
    Display/        # TV display (full-screen art viewer)
  global/           # Socket connection (header.js)
  App.js            # Routing logic
package.json        # Frontend dependencies + dev scripts
server/             # Socket + data service
  src/
    socket.server.js  # Express + Socket.io server, serves static build
    data.service.js   # Data layer: SQLite reads/writes, image fetching, ColorThief
    db/database.js    # SQLite schema, singleton, seed data
    scheduler.controller.js
    config.js
  package.json      # Server dependencies
  data/             # SQLite database (gitignored)
scripts/
  setup-pi.sh       # One-time Raspberry Pi setup
  deploy.sh         # Build + deploy to Pi
```


## Setup

### Requirements
- Node.js v20+
- Yarn

### Install
```bash
yarn install
cd server && npm install && cd ..
```

### Configuration
Create a `.env` file in the repo root (copy from `.env.example` or use the keys below):

```
SOCKET_PORT=3001
SOCKET_HOST=127.0.0.1
CORS_ORIGINS=http://localhost:3000

SLACK_TOKEN=your_slack_token

RECEIVER_ENABLED=true
RECEIVER_IP=192.168.x.x
RECEIVER_INPUT=GAME
CEC_ENABLED=false

REACT_APP_SOCKET_URL=http://localhost:3001/

PI_HOST=192.168.x.x
PI_USER=pi
PI_PASSWORD=yourpassword
```

The SQLite database is auto-created at `server/data/artele.db` on first run with seed sources and default settings.


## Development

### `yarn dev`
Starts both the React app and the socket server together.
- Mobile remote: [http://localhost:3000](http://localhost:3000)
- TV display: [http://localhost:3000/display](http://localhost:3000/display)
- Socket server health: [http://localhost:3001/health](http://localhost:3001/health)

### `yarn start`
React app only (port 3000).

### `yarn server`
Socket + data service only (port 3001).

### `yarn build`
Builds the React app for production to the `build/` folder. The socket server serves this static build.


## Mobile Remote (/)

The mobile interface has three tabs:

**ART** — Playback controls
- Play / Pause the artwork rotation
- PREV / NEXT to navigate through artwork history (up to 30 images remembered)
- Save current artwork to Slack

**SCHEDULE** — Timing and hours
- Seconds per artwork (minimum 5)
- Weekday and weekend on/off schedule

**SOURCES** — API source management
- Add, edit, and delete museum/image API sources
- Toggle sources active/inactive in the rotation
- Test an API endpoint with a sample object ID
- Clear cached object ID pools
- Trigger an image pool refresh (UPDATE IMAGES)


## Deployment to Raspberry Pi

### First-time setup
Run once from the project root on your Mac:
```bash
yarn setup-pi
```
This installs SSH key auth, Node.js v20, and pm2 on the Pi. You'll be prompted for the Pi password once.

### Deploy
```bash
yarn deploy
```
This builds the React app with the Pi's IP baked in, rsyncs all files to `~/artele` on the Pi, writes a production `.env`, installs server dependencies, and restarts the app via pm2.

### On the Pi
The app runs under pm2 as the `artele` process:
```bash
pm2 status
pm2 logs artele
pm2 restart artele
```

App is accessible at `http://<PI_HOST>:3001`.
