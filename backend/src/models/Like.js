import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index - a user can only like a blog once
likeSchema.index({ user: 1, blog: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

export default Like;
