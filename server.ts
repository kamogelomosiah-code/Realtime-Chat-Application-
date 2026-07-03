import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

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

  const PORT = 3000;

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
      // Must have recipient, no public chat
      if (msg.recipient && msg.recipient !== "All" && msg.recipient !== "") {
        // Find recipient's IP profile
        let recipientProfile: UserProfile | undefined;
        let recipientIp: string | undefined;

        for (const [rIp, profile] of ipProfiles.entries()) {
          if (profile.username === msg.recipient) {
            recipientProfile = profile;
            recipientIp = rIp;
            break;
          }
        }

        if (recipientProfile && recipientProfile.socketId) {
          io.to(recipientProfile.socketId).emit("chat_message", msg);
          socket.emit("chat_message", msg); // Also emit to sender
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
