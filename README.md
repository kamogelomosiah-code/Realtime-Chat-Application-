# Realtime Chat

A real-time chat application built with React, TypeScript, Express, and Socket.IO. The browser client and server communicate over Socket.IO for live messaging. Built in [Google AI Studio](https://ai.studio/apps/b18a3770-12a6-4703-990c-34c43d026c8a). Suggested GitHub name: `realtime-chat-app`.

## Where this project is now (27 Nov 2026)

**Status: working prototype.**

| | |
|---|---|
| **Works** | Installs, type-checks and builds cleanly. Join with a name, see who is online, send a private message to one person, typing indicator, profile picture, friends list (kept in the browser), configurable server address |
| **Connected to MasterAPI (optional)** | With `MASTERAPI_URL` and `MASTERAPI_KEY` set, the **words** of each message are saved, a returning person gets their last 100 messages back (even after the server restarts), and a message sent to someone who is offline reaches them when they join. Tested with simulated users, a server restart, and MasterAPI being down |
| **Fixed with it** | The server now decides who a message is from. Before, it trusted the name the browser sent, so anyone could pose as someone else. Messages from people who have not joined, and over 4,000 characters, are ignored |
| **Limits by design** | There is no public room, only one-to-one messages. Pictures and voice notes are live only (saved as "[picture]" / "[voice message]"). Who is who is tracked by IP address, so two people on the same network can collide, and there are no passwords |
| **Privacy** | This app is called *Ephemeral Relay*, so saving history is **off by default**. Without the two MasterAPI settings nothing is saved and messages vanish, as before |
| **Not verified** | A run with two real devices at the same time, and MasterAPI on Render |

**Next, in order:** real accounts (MasterAPI can provide them) and a proper way to identify people instead of IP address.

## Requirements

- Node.js 18 or newer
- npm

## Getting started

```bash
npm install
npm run dev
```

The development command starts the TypeScript server and the Vite-powered frontend. If the project needs environment values, copy `.env.example` to `.env` and configure them locally. Never commit credentials.

## Saving history with MasterAPI (optional)

Create an app in the MasterAPI console, then set these two variables on the server (for example in Render → Environment):

```
MASTERAPI_URL=https://your-masterapi.onrender.com
MASTERAPI_KEY=mk_live_…
```

Messages are saved in a `chat_messages` collection. If MasterAPI is missing or down, chat keeps working live and nothing is saved. The server also reads `PORT` from its host.

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
