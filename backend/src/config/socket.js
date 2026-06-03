import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClient } from "./redis.js";

let io = null;

const configureSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 5e6, // 5MB for whiteboard payloads
  });

  // Setup Redis adapter for horizontal scaling
  try {
    const redisClient = getRedisClient();
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io Redis adapter configured");
  } catch (error) {
    console.warn("Socket.io running without Redis adapter:", error.message);
  }

  console.log("Socket.io configured");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call configureSocket() first.");
  }
  return io;
};

export default configureSocket;
