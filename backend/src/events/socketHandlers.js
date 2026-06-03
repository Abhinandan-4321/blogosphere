import Draft from "../models/Draft.js";
import { verifyAccessToken } from "../utils/token.js";

const registerSocketHandlers = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Join personal room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Draft auto-save handler
    socket.on("draft:save", async (data) => {
      try {
        const { draftId, title, content, tags, category, coverImage } = data;

        const updateData = {
          lastSavedAt: new Date(),
        };

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (tags !== undefined) updateData.tags = tags;
        if (category !== undefined) updateData.category = category;
        if (coverImage !== undefined) updateData.coverImage = coverImage;

        let draft;
        if (draftId) {
          // Update existing draft
          draft = await Draft.findOneAndUpdate(
            { _id: draftId, author: userId },
            updateData,
            { new: true }
          );
        } else {
          // Create new draft
          draft = await Draft.create({
            author: userId,
            ...updateData,
          });
        }

        socket.emit("draft:saved", {
          draftId: draft._id,
          lastSavedAt: draft.lastSavedAt,
        });
      } catch (error) {
        socket.emit("draft:error", { message: "Failed to save draft" });
      }
    });

    // Join blog room for real-time updates
    socket.on("blog:join", (blogId) => {
      socket.join(`blog:${blogId}`);
    });

    // Leave blog room
    socket.on("blog:leave", (blogId) => {
      socket.leave(`blog:${blogId}`);
    });

    // Chat: join a conversation room
    socket.on("chat:join", (conversationId) => {
      socket.join(`chat:${conversationId}`);
    });

    // Chat: leave a conversation room
    socket.on("chat:leave", (conversationId) => {
      socket.leave(`chat:${conversationId}`);
    });

    // Chat: typing indicator
    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      socket.to(`chat:${conversationId}`).emit("chat:typing", {
        conversationId,
        userId,
        isTyping,
      });
    });

    // Whiteboard: join a whiteboard room
    socket.on("whiteboard:join", (whiteboardId) => {
      socket.join(`wb:${whiteboardId}`);
      console.log(`[WB] User ${userId} joined wb:${whiteboardId}`);
      // Notify others in the room that a peer joined
      socket.to(`wb:${whiteboardId}`).emit("whiteboard:peer-joined", { userId });
    });

    // Whiteboard: leave a whiteboard room
    socket.on("whiteboard:leave", (whiteboardId) => {
      socket.leave(`wb:${whiteboardId}`);
      console.log(`[WB] User ${userId} left wb:${whiteboardId}`);
    });

    // Whiteboard: broadcast scene changes to other user
    socket.on("whiteboard:update", ({ whiteboardId, elements, appState }) => {
      console.log(`[WB] Update from ${userId} on wb:${whiteboardId}, ${elements?.length || 0} elements`);
      socket.to(`wb:${whiteboardId}`).emit("whiteboard:update", {
        whiteboardId,
        elements,
        appState,
        userId,
      });
    });

    // Whiteboard: cursor position
    socket.on("whiteboard:cursor", ({ whiteboardId, cursor }) => {
      socket.to(`wb:${whiteboardId}`).emit("whiteboard:cursor", {
        userId,
        cursor,
      });
    });

    socket.on("disconnect", () => {
      // Cleanup if needed
    });
  });
};

export default registerSocketHandlers;
