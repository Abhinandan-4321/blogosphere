import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    folder: {
      type: String,
      default: "default",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, folder: 1 });

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

export default Bookmark;
