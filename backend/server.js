import { createServer } from "http";
import dotenv from "dotenv";

// Load env variables first
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import connectRedis from "./src/config/redis.js";
import configureCloudinary from "./src/config/cloudinary.js";
import configurePassport from "./src/config/passport.js";
import configureResend from "./src/config/resend.js";
import configureTwilio from "./src/config/twilio.js";
import configureSocket from "./src/config/socket.js";
import registerSocketHandlers from "./src/events/socketHandlers.js";
import seedAdmin from "./src/utils/seedAdmin.js";
import { startAutoDeleteJob } from "./src/jobs/autoDeleteFlaggedPosts.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis Cloud
    connectRedis();

    // Configure services
    configureCloudinary();
    configurePassport();
    configureResend();
    configureTwilio();

    // Seed admin account
    await seedAdmin();

    // Create HTTP server
    const httpServer = createServer(app);

    // Configure Socket.io
    const io = configureSocket(httpServer);
    registerSocketHandlers(io);

    // Start cron jobs
    startAutoDeleteJob();

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
