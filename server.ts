import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

// --- MasterAPI: saves messages so history survives restarts, and so messages sent to someone offline reach them later ---
// Optional. Set MASTERAPI_URL and MASTERAPI_KEY to turn it on. If it is missing or down, chat works as before.
const MASTERAPI_URL = (process.env.MASTERAPI_URL || "").replace(/\/$/, "");
const MASTERAPI_KEY = process.env.MASTERAPI_KEY || "";
const persistence = Boolean(MASTERAPI_URL && MASTERAPI_KEY);
const HISTORY_COLLECTION = "chat_messages";
const HISTORY_LIMIT = 100;
const MAX_TEXT = 4000;

async function masterApi(method: string, apiPath: string, body?: unknown): Promise<any> {
  const res = await fetch(`${MASTERAPI_URL}/api/v1${apiPath}`, {
    method,
    headers: { "x-api-key": MASTERAPI_KEY, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`MasterAPI answered HTTP ${res.status}`);
  return res.json();
}

/** Saves the words of a message. Pictures and voice notes are live-only, so history stays small. */
async function saveMessage(msg: { id: string; sender: string; recipient: string; text: string; image?: string; audio?: string; timestamp: number }): Promise<boolean> {
  if (!persistence) return false;
  try {
    await masterApi("POST", `/data/${HISTORY_COLLECTION}`, {
      mid: msg.id,
      sender: msg.sender,
      recipient: msg.recipient,
      text: msg.text || (msg.image ? "[picture]" : msg.audio ? "[voice message]" : ""),
      timestamp: msg.timestamp,
    });
    return true;
  } catch (e: any) {
    console.warn(`History not saved: ${e.message}`);
    return false;
  }
}

/** The most recent messages this person sent or received, oldest first. */
async function loadHistory(username: string): Promise<any[]> {
  if (!persistence) return [];
  try {
    const r = await masterApi("POST", `/data/${HISTORY_COLLECTION}/query`, {
      filter: { $or: [{ sender: username }, { recipient: username }] },
      sort: "-timestamp",
      limit: HISTORY_LIMIT,
    });
    return (r.data as any[]).reverse().map((d) => ({ id: d.mid || d.id, sender: d.sender, recipient: d.recipient, text: d.text, timestamp: d.timestamp }));
  } catch (e: any) {
    console.warn(`History not loaded: ${e.message}`);
    return [];
  }
}

interface UserProfile {
  username: string;
  displayPicture: string | null;
  socketId: string;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Map of ip -> UserProfile
  const ipProfiles = new Map<string, UserProfile>();
  const socketToIp = new Map<string, string>();

  function getIp(socket: any) {
    const header = socket.handshake.headers['x-forwarded-for'];
    const ip = (Array.isArray(header) ? header[0] : header?.split(',')[0]) || socket.handshake.address;
    return ip;
  }

  function broadcastUserList() {
    // Only send online users
    const onlineUsers = Array.from(ipProfiles.entries())
      .map(([ip, profile]) => ({ ...profile, ip }))
      .filter(u => u.socketId); // Only currently connected
    io.emit("user_list", onlineUsers);
  }

  io.on("connection", (socket) => {
    const ip = getIp(socket);
    socketToIp.set(socket.id, ip);

    // If they already have an IP locked profile, auto join them? 
    // They will send "join" anyway.

    socket.on("join", (data: { username: string, displayPicture?: string | null }) => {
      const { username, displayPicture } = data;
      const existingProfileId = ipProfiles.get(ip);
      
      // Check if another IP is using this username
      for (const [otherIp, profile] of ipProfiles.entries()) {
        if (profile.username === username && otherIp !== ip) {
          socket.emit("join_error", "Username is already registered to another user's session.");
          return;
        }
      }

      // If this IP has a different name, override it to their locked name if we want strict locking,
      // or we can just update their profile. The prompt said "lock in the names of clients to their IP"
      // It implies if an IP has registered a name, they continue using it, but since this is first time:
      let finalName = username;
      if (existingProfileId && existingProfileId.username) {
        finalName = existingProfileId.username; // Force their locked name
      }

      ipProfiles.set(ip, {
        username: finalName,
        displayPicture: displayPicture || existingProfileId?.displayPicture || null,
        socketId: socket.id
      });

      socket.emit("join_success", { username: finalName, displayPicture });
      broadcastUserList();
      io.emit("user_joined", finalName);
      // Earlier conversations, including messages sent while this person was offline.
      loadHistory(finalName).then((history) => {
        if (history.length) socket.emit("history", history);
      });
    });

    socket.on("update_profile", (data: { displayPicture: string }) => {
      const profile = ipProfiles.get(ip);
      if (profile) {
        profile.displayPicture = data.displayPicture;
        ipProfiles.set(ip, profile);
        broadcastUserList();
      }
    });

    socket.on("chat_message", (msg) => {
      // Only people who have joined can send, and the sender is whoever this connection really is.
      // (The browser's own "sender" field is ignored, so nobody can pose as someone else.)
      const me = ipProfiles.get(ip);
      if (!me || !me.username || !msg || typeof msg !== "object") return;
      if (typeof msg.text === "string" && msg.text.length > MAX_TEXT) return;
      // Must have recipient, no public chat
      if (msg.recipient && msg.recipient !== "All" && msg.recipient !== "") {
        msg.sender = me.username;

        // Find recipient's IP profile
        let recipientProfile: UserProfile | undefined;

        for (const [, profile] of ipProfiles.entries()) {
          if (profile.username === msg.recipient) {
            recipientProfile = profile;
            break;
          }
        }

        if (recipientProfile && recipientProfile.socketId) {
          io.to(recipientProfile.socketId).emit("chat_message", msg);
          socket.emit("chat_message", msg); // Also emit to sender
          saveMessage(msg);
        } else if (persistence) {
          // The recipient is offline: keep it, and they will get it when they join.
          // The sender sees it only once it is safely kept.
          saveMessage(msg).then((kept) => {
            if (kept) socket.emit("chat_message", msg);
          });
        }
      }
    });

    socket.on("typing", (data) => {
      if (data.recipient) {
        for (const [rIp, profile] of ipProfiles.entries()) {
          if (profile.username === data.recipient && profile.socketId) {
            io.to(profile.socketId).emit("typing", data);
            break;
          }
        }
      }
    });

    socket.on("disconnect", () => {
      socketToIp.delete(socket.id);
      const profile = ipProfiles.get(ip);
      if (profile && profile.socketId === socket.id) {
        profile.socketId = ""; // mark offline
        broadcastUserList();
        io.emit("user_left", profile.username);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
