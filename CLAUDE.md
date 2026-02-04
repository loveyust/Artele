# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Artele is a React+Node.js digital art display application for Raspberry Pi. It displays museum artwork from multiple APIs (The Met, Cooper Hewitt, NASA) on a TV and provides a mobile control interface. The system integrates with Onkyo AV receivers and CEC-enabled TVs for automated power management.

## Build and Development Commands

```bash
npm run dev          # Install dependencies and start development
npm start            # Start React dev server + socket server (frontend :3000, socket :3001)
npm run build        # Production build (bundles frontend + copies services to build/)
npm run socket-serve--dev  # Run socket server standalone
```

Note: Uses `--openssl-legacy-provider` flag for Node.js compatibility with older dependencies.

## Architecture

**Dual-Interface System:**
- `/` - Mobile control interface (Artele container) for managing museums, schedules, and settings
- `/display` - Fullscreen TV display (Display container) showing rotating artwork

**Real-time Communication:**
- All client-server communication uses Socket.io (port 3001), not HTTP requests
- Socket client initialized globally in `src/global/header.js`
- Event-driven architecture with emit/listen pattern

**Key Services (src/services/):**
- `data.service.js` - Singleton managing all data: Airtable CMS access, museum API calls, image rotation, color extraction
- `socket.server.js` - Socket.io server, message routing between frontend and backend
- `scheduler.controller.js` - Cron scheduling for automated on/off times
- `receiver.controller.js` - Onkyo receiver control (hardcoded IP: 192.168.50.97)

**Data Flow:**
- Airtable is the single source of truth for all configuration
- DataService caches museum object IDs and transforms data
- UI receives data via Socket.io events and props
- ColorThief extracts dominant colors from images for dynamic mat backgrounds

**Configuration:**
- `src/environment.js` (gitignored) - Contains Airtable API keys, Slack tokens
- Airtable tables store: active museums, API endpoints, rotation timing, scheduling, display settings

## Deployment to Raspberry Pi

```bash
npm run build
scp -r ./build pi@192.168.1.XXX:/home/pi/Desktop/
```

On RPi, the startup script (`utilities/start-kiosk.sh`) launches:
1. Socket server: `node build/services/socket.server.js`
2. Web server: `serve -s build -l 3000`
3. Chromium kiosk mode pointing to `http://localhost:3000/display`

## Key Implementation Notes

- ES modules enabled (`"type": "module"` in package.json)
- Image rotation: randomly selects museum (weighted), random artwork, extracts dominant color, auto-adjusts text color for contrast using YIQ method
- Scheduling: node-schedule cron jobs for weekday/weekend times, can trigger receiver power cycles
- Hardware: Controls Onkyo receiver via onkyo.js, TV via CEC
