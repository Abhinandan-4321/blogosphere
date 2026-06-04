import cron from "node-cron";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import Notification from "../models/Notification.js";
import { NOTIFICATION_TYPES } from "../utils/constants.js";
import { createNotification } from "../services/notificationService.js";
import { deleteCachePattern } from "../services/cacheService.js";

// Run every hour to check for expired flagged posts
export const startAutoDeleteJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      
      // Find all flagged posts where deadline has passed
      const expiredPosts = await Blog.find({
        flagged: true,
        deletionDeadline: { $lte: now },
      }).populate("author", "name email");

      if (expiredPosts.length === 0) {
        return;
      }

      console.log(`[Auto-Delete] Found ${expiredPosts.length} expired flagged posts`);

      for (const blog of expiredPosts) {
        try {
          // Notify author about auto-deletion
          await createNotification({
            recipient: blog.author._id,
            type: NOTIFICATION_TYPES.ADMIN_ACTION,
            message: `Your flagged post "${blog.title}" has been automatically deleted after the 2-day deadline.`,
            relatedBlog: blog._id,
          });

          // Delete associated data
          await Promise.all([
            Comment.deleteMany({ blog: blog._id }),
            Like.deleteMany({ blog: blog._id }),
            Notification.deleteMany({
              relatedBlog: blog._id,
              type: NOTIFICATION_TYPES.POST_FLAGGED,
            }),
            Blog.findByIdAndDelete(blog._id),
          ]);

          console.log(`[Auto-Delete] Deleted blog: ${blog.title} (${blog._id})`);
        } catch (err) {
          console.error(`[Auto-Delete] Failed to delete blog ${blog._id}:`, err.message);
        }
      }

      // Clear blog cache
      await deleteCachePattern("blogs:*");
      
      console.log(`[Auto-Delete] Successfully processed ${expiredPosts.length} posts`);
    } catch (error) {
      console.error("[Auto-Delete] Job failed:", error.message);
    }
  });

  console.log("[Auto-Delete] Cron job started - runs every hour");
};
