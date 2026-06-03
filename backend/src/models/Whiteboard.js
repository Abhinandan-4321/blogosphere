import mongoose from "mongoose";

const whiteboardSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "Untitled Whiteboard",
    },
    sceneData: {
      type: mongoose.Schema.Types.Mixed,
      default: { elements: [], appState: {} },
    },
  },
  {
    timestamps: true,
  }
);

whiteboardSchema.index({ conversation: 1, createdAt: -1 });

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

export default Whiteboard;
