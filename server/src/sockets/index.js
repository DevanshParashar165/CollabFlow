import { Server } from "socket.io";
import environment from "../config/environment.js";
import logger from "../utils/logger.js";
import cookie from "cookie";
import { COOKIE_NAME, verifyToken } from "../utils/jwt.js";
import { getUserById } from "../services/authService.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import mongoose from "mongoose";

let io = null;
const presence = new Map();

const socketError = (message, callback) => {
  const error = { message };
  if (typeof callback === "function") callback(error);
  return error;
};

const safeUser = (user) => ({
  id: user?._id?.toString?.() || user?._id,
  name: user?.name || "User",
  avatar: user?.avatar || "",
});

const broadcastPresence = (workspaceId) => {
  const users = [...(presence.get(workspaceId) || new Map()).values()];
  io.to(`workspace:${workspaceId}`).emit("workspace:presence", {
    workspaceId,
    users,
  });
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: environment.clientUrl,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies[COOKIE_NAME];
      if (!token) return next(new Error("Authentication required"));
      const decoded = verifyToken(token);
      if (!decoded?.id) return next(new Error("Invalid authentication token"));
      const user = await getUserById(decoded.id);
      if (!user) return next(new Error("Authenticated user not found"));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?._id?.toString?.() || socket.user?._id;
    if (userId) {
      socket.join(`user:${userId}`);
    }
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("workspace:join", async (workspaceId, callback) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(workspaceId))
          return socketError("Invalid workspace identifier", callback);
        const workspace = await Workspace.findById(workspaceId);
        const membership = await WorkspaceMember.findOne({
          workspaceId,
          userId: socket.user._id,
        });
        if (!workspace || !membership)
          return socketError("Workspace access denied", callback);

        const room = `workspace:${workspaceId}`;
        await socket.join(room);
        socket.data.workspaces ||= new Set();
        socket.data.workspaces.add(workspaceId.toString());
        if (!presence.has(workspaceId.toString()))
          presence.set(workspaceId.toString(), new Map());
        presence
          .get(workspaceId.toString())
          .set(socket.user._id.toString(), safeUser(socket.user));
        broadcastPresence(workspaceId.toString());
        if (typeof callback === "function") callback({ ok: true, workspaceId });
      } catch (error) {
        socketError("Unable to join workspace", callback);
      }
    });

    socket.on("workspace:leave", async (workspaceId, callback) => {
      const key = workspaceId?.toString();
      if (!key || !socket.data.workspaces?.has(key))
        return socketError("Workspace room not joined", callback);
      await socket.leave(`workspace:${key}`);
      socket.data.workspaces.delete(key);
      presence.get(key)?.delete(socket.user._id.toString());
      if (presence.get(key)?.size === 0) presence.delete(key);
      broadcastPresence(key);
      if (typeof callback === "function")
        callback({ ok: true, workspaceId: key });
    });

    socket.on("disconnect", (reason) => {
      for (const workspaceId of socket.data.workspaces || []) {
        presence.get(workspaceId)?.delete(socket.user._id.toString());
        if (presence.get(workspaceId)?.size === 0) presence.delete(workspaceId);
        broadcastPresence(workspaceId);
      }
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const emitToWorkspace = (workspaceId, event, payload) => {
  if (!io || !workspaceId) return false;
  io.to(`workspace:${workspaceId}`).emit(event, payload);
  return true;
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  io.to(`user:${userId.toString()}`).emit(event, payload);
  return true;
};

export const getPresence = () => presence;

/**
 * Get active Socket.IO server instance.
 */
export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket first.",
    );
  }
  return io;
};

export default {
  initSocket,
  getIO,
  emitToWorkspace,
  emitToUser,
  getPresence,
};
