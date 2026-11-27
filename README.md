# Realtime Chat

A real-time chat application built with React, TypeScript, Express, and Socket.IO. The browser client and server communicate over Socket.IO for live messaging. Built in [Google AI Studio](https://ai.studio/apps/b18a3770-12a6-4703-990c-34c43d026c8a). Suggested GitHub name: `realtime-chat-app`.

## Where this project is now (27 Nov 2026)

**Status: working prototype.**

| | |
|---|---|
| **Works** | Installs, type-checks and builds cleanly. Join with a name, see who is online, send a private message to one person, typing indicator, profile picture, friends list (kept in the browser), configurable server address |
| **Limits by design** | There is no public room, only one-to-one messages. **Messages are not saved**: they are delivered live and then gone. Who is who is tracked by IP address, so two people on the same network can collide, and there are no passwords |
| **Not verified** | A run with two real devices at the same time |

**Next, in order:** real accounts, saving message history (MasterAPI could store it), and a proper way to identify people instead of IP address.

## Requirements

- Node.js 18 or newer
- npm

## Getting started

```bash
npm install
npm run dev
```

The development command starts the TypeScript server and the Vite-powered frontend. If the project needs environment values, copy `.env.example` to `.env` and configure them locally. Never commit credentials.

## Production build

```bash
npm run build
npm start
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server |
| `npm run build` | Build the frontend and server bundle |
| `npm start` | Start the built server |
| `npm run lint` | Run the TypeScript check |

## Tech stack

React · TypeScript · Vite · Express · Socket.IO

## Project layout

- `src/App.tsx` — the whole chat screen
- `server.ts` — Express + Socket.IO server (`join`, `update_profile`, `chat_message`, `typing`)
- `index.html` — frontend entry document
