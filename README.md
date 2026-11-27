# Realtime Chat

A private one-to-one chat over websockets (Socket.IO), with profile pictures, online users and typing indicators.
React + Vite on the front end, Express + Socket.IO on the server. Built in [Google AI Studio](https://ai.studio/apps/b18a3770-12a6-4703-990c-34c43d026c8a).
Suggested GitHub name: `realtime-chat-app`.

## Where this project is now (27 Nov 2026)

**Status: working prototype.**

| | |
|---|---|
| **Works** | Installs, type-checks and builds cleanly. Join with a name, see who is online, send a private message to one person, typing indicator, profile picture, friends list (kept in the browser), configurable server address |
| **Limits by design** | There is no public room, only one-to-one messages. **Messages are not saved**: they are delivered live and then gone. Who is who is tracked by IP address, so two people on the same network can collide, and there are no passwords |
| **Not verified** | A run with two real devices at the same time |

**Next, in order:** real accounts, saving message history (MasterAPI could store it), and a proper way to identify people instead of IP address.

## Run locally

**Prerequisite:** Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run lint` (type check), `npm run build`, `npm start` (runs the built server).

## Layout

```
src/App.tsx   the whole chat screen
server.ts     Express + Socket.IO server (join, update_profile, chat_message, typing)
```
