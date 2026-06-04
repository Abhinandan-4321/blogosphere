import mongoose from "mongoose";
import { BLOG_STATUS, BLOG_VISIBILITY } from "../utils/constants.js";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt must not exceed 500 characters"],
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    visibility: {
      type: String,
      enum: Object.values(BLOG_VISIBILITY),
      default: BLOG_VISIBILITY.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(BLOG_STATUS),
      default: BLOG_STATUS.PUBLISHED,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number, // in minutes
      default: 1,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    deletionDeadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
blogSchema.index({ title: "text", content: "text", tags: "text" });
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ slug: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });

// Calculate read time before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // Auto-generate excerpt from content
  if (this.isModified("content") && !this.excerpt) {
    this.excerpt = this.content.replace(/<[^>]*>/g, "").substring(0, 300);
  }

  next();
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
