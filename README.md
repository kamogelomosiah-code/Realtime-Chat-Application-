# Realtime Chat

A real-time chat application built with React, TypeScript, Express, and Socket.IO. The browser client and server communicate over Socket.IO for live messaging.

## Requirements

- Node.js
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

- `src/` — application source
- `server.ts` — server entry point
- `index.html` — frontend entry document
