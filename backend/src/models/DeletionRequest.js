import mongoose from "mongoose";

const deletionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      maxlength: [500, "Reason must not exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvalReason: {
      type: String,
      maxlength: [500, "Approval reason must not exceed 500 characters"],
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DeletionRequest", deletionRequestSchema);
