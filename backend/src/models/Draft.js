import mongoose from "mongoose";

const draftSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
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
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

draftSchema.index({ author: 1, updatedAt: -1 });

const Draft = mongoose.model("Draft", draftSchema);

export default Draft;
