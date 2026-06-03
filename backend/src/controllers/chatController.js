import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";
import Whiteboard from "../models/Whiteboard.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { PAGINATION, NOTIFICATION_TYPES } from "../utils/constants.js";
import { getIO } from "../config/socket.js";
import { createNotification } from "../services/notificationService.js";

// Helper: check if two users mutually follow each other
const areMutualFollowers = async (userA, userB) => {
  const [aFollowsB, bFollowsA] = await Promise.all([
    Follow.exists({ follower: userA, following: userB }),
    Follow.exists({ follower: userB, following: userA }),
  ]);
  return !!(aFollowsB && bFollowsA);
};

// @desc    Get all mutual followers (potential chat partners)
// @route   GET /api/conversations/mutual
export const getMutualFollowers = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get users I follow
    const myFollowing = await Follow.find({ follower: userId }).select(
      "following"
    );
    const myFollowingIds = myFollowing.map((f) => f.following.toString());

    // Get users who follow me
    const myFollowers = await Follow.find({ following: userId }).select(
      "follower"
    );
    const myFollowerIds = myFollowers.map((f) => f.follower.toString());

    // Find the intersection
    const mutualIds = myFollowingIds.filter((id) => myFollowerIds.includes(id));

    const mutuals = await User.find({ _id: { $in: mutualIds } }).select(
      "name avatar bio"
    );

    return sendSuccess(res, 200, "Mutual followers retrieved", mutuals);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for the current user
// @route   GET /api/conversations
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      hiddenBy: { $ne: req.user._id },
    })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name avatar deletedAt")
      .populate({
        path: "lastMessage",
        select: "content messageType sender createdAt",
      });

    // Map to include the other participant and unread count
    const mapped = conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return {
        _id: conv._id,
        otherUser: other,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCounts?.get(req.user._id.toString()) || 0,
      };
    });

    return sendSuccess(res, 200, "Conversations retrieved", mapped);
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create a conversation with a specific user
// @route   POST /api/conversations
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (userId === req.user._id.toString()) {
      return sendError(res, 400, "Cannot chat with yourself");
    }

    // Verify mutual follow
    const mutual = await areMutualFollowers(req.user._id, userId);
    if (!mutual) {
      return sendError(
        res,
        403,
        "Both users must follow each other to chat"
      );
    }

    // Check for existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("participants", "name avatar")
      .populate({
        path: "lastMessage",
        select: "content messageType sender createdAt",
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        unreadCounts: new Map([
          [req.user._id.toString(), 0],
          [userId, 0],
        ]),
      });
      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "name avatar")
        .populate({
          path: "lastMessage",
          select: "content messageType sender createdAt",
        });
    }

    const other = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    return sendSuccess(res, 200, "Conversation retrieved", {
      _id: conversation._id,
      otherUser: other,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount:
        conversation.unreadCounts?.get(req.user._id.toString()) || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
export const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || 30,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar"),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    return sendPaginated(
      res,
      200,
      "Messages retrieved",
      messages.reverse(),
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Send a text message
// @route   POST /api/conversations/:id/messages
export const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content?.trim()) {
      return sendError(res, 400, "Message content is required");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
      messageType: "text",
    });

    const populatedMessage = await message.populate("sender", "name avatar");

    // Update conversation
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    const currentUnread =
      conversation.unreadCounts?.get(otherUserId.toString()) || 0;
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    conversation.unreadCounts.set(
      otherUserId.toString(),
      currentUnread + 1
    );
    await conversation.save();

    // Emit via socket
    const io = getIO();
    io.to(`user:${otherUserId}`).emit("chat:message", {
      conversationId,
      message: populatedMessage,
    });

    // Push notification for offline user
    createNotification({
      recipient: otherUserId,
      type: NOTIFICATION_TYPES.CHAT_MESSAGE,
      message: `${req.user.name} sent you a message`,
      relatedUser: req.user._id,
    }).catch(() => {});

    return sendSuccess(res, 201, "Message sent", populatedMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Send an image message
// @route   POST /api/conversations/:id/messages/image
export const sendImageMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, "At least one image is required");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const imageUrls = req.files.map((f) => f.path);

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: "",
      images: imageUrls,
      messageType: "image",
    });

    const populatedMessage = await message.populate("sender", "name avatar");

    // Update conversation
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    const currentUnread =
      conversation.unreadCounts?.get(otherUserId.toString()) || 0;
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    conversation.unreadCounts.set(
      otherUserId.toString(),
      currentUnread + 1
    );
    await conversation.save();

    // Emit via socket
    const io = getIO();
    io.to(`user:${otherUserId}`).emit("chat:message", {
      conversationId,
      message: populatedMessage,
    });

    // Push notification for offline user
    createNotification({
      recipient: otherUserId,
      type: NOTIFICATION_TYPES.CHAT_MESSAGE,
      message: `${req.user.name} sent you an image`,
      relatedUser: req.user._id,
    }).catch(() => {});

    return sendSuccess(res, 201, "Image sent", populatedMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation as read
// @route   PATCH /api/conversations/:id/read
export const markConversationRead = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    conversation.unreadCounts.set(req.user._id.toString(), 0);
    await conversation.save();

    // Mark all unread messages from other user as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readAt: null,
      },
      { readAt: new Date() }
    );

    // Notify sender of read receipt
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    const io = getIO();
    io.to(`user:${otherUserId}`).emit("chat:read", { conversationId });

    return sendSuccess(res, 200, "Conversation marked as read");
  } catch (error) {
    next(error);
  }
};

// @desc    Create a whiteboard session
// @route   POST /api/conversations/:id/whiteboard
export const createWhiteboard = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { name } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const whiteboard = await Whiteboard.create({
      conversation: conversationId,
      createdBy: req.user._id,
      name: name || "Untitled Whiteboard",
    });

    // Create a whiteboard message in chat
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: `Started a whiteboard: ${whiteboard.name}`,
      messageType: "whiteboard",
      whiteboardId: whiteboard._id,
    });

    const populatedMessage = await message.populate("sender", "name avatar");

    // Update conversation
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    const currentUnread =
      conversation.unreadCounts?.get(otherUserId.toString()) || 0;
    conversation.unreadCounts.set(otherUserId.toString(), currentUnread + 1);
    await conversation.save();

    // Emit via socket
    const io = getIO();
    io.to(`user:${otherUserId}`).emit("chat:message", {
      conversationId,
      message: populatedMessage,
    });

    // Notify the other user
    createNotification({
      recipient: otherUserId,
      type: NOTIFICATION_TYPES.CHAT_MESSAGE,
      message: `${req.user.name} started a whiteboard — join to collaborate!`,
      relatedUser: req.user._id,
    }).catch(() => {});

    return sendSuccess(res, 201, "Whiteboard created", {
      whiteboard,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a whiteboard
// @route   GET /api/conversations/:id/whiteboard/:whiteboardId
export const getWhiteboard = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const whiteboardId = req.params.whiteboardId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const whiteboard = await Whiteboard.findOne({
      _id: whiteboardId,
      conversation: conversationId,
    });

    if (!whiteboard) {
      return sendError(res, 404, "Whiteboard not found");
    }

    return sendSuccess(res, 200, "Whiteboard retrieved", whiteboard);
  } catch (error) {
    next(error);
  }
};

// @desc    Save whiteboard data
// @route   PUT /api/conversations/:id/whiteboard/:whiteboardId
export const saveWhiteboard = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const whiteboardId = req.params.whiteboardId;
    const { sceneData } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { _id: whiteboardId, conversation: conversationId },
      { sceneData },
      { new: true }
    );

    if (!whiteboard) {
      return sendError(res, 404, "Whiteboard not found");
    }

    return sendSuccess(res, 200, "Whiteboard saved", whiteboard);
  } catch (error) {
    next(error);
  }
};

// @desc    List whiteboards for a conversation
// @route   GET /api/conversations/:id/whiteboards
export const listWhiteboards = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const whiteboards = await Whiteboard.find({
      conversation: conversationId,
    })
      .sort({ updatedAt: -1 })
      .select("name createdBy createdAt updatedAt");

    return sendSuccess(res, 200, "Whiteboards retrieved", whiteboards);
  } catch (error) {
    next(error);
  }
};

// @desc    Hide a conversation from user's list
// @route   PATCH /api/conversations/:id/hide
export const hideConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    // Add user to hiddenBy array if not already there
    if (!conversation.hiddenBy.includes(req.user._id)) {
      conversation.hiddenBy.push(req.user._id);
      await conversation.save();
    }

    return sendSuccess(res, 200, "Conversation hidden");
  } catch (error) {
    next(error);
  }
};

// @desc    Unhide a conversation
// @route   PATCH /api/conversations/:id/unhide
export const unhideConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    // Remove user from hiddenBy array
    conversation.hiddenBy = conversation.hiddenBy.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await conversation.save();

    return sendSuccess(res, 200, "Conversation unhidden");
  } catch (error) {
    next(error);
  }
};
