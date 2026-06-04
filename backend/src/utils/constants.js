export const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const BLOG_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
};

export const BLOG_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
};

export const NOTIFICATION_TYPES = {
  NEW_POST: "new_post",
  LIKE: "like",
  COMMENT: "comment",
  FOLLOW: "follow",
  ADMIN_ACTION: "admin_action",
  APPROVAL: "approval",
  CHAT_MESSAGE: "chat_message",
  COFFEE_RECEIVED: "coffee_received",
  POST_FLAGGED: "post_flagged",
};

export const OTP_METHODS = {
  EMAIL: "email",
  SMS: "sms",
};

export const OTP_TTL = 300; // 5 minutes in seconds

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  DAY: 86400,      // 24 hours
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};
