import Joi from "joi";

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Comment cannot be empty",
    "string.max": "Comment must not exceed 2000 characters",
    "any.required": "Comment content is required",
  }),
  parentComment: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "Invalid parent comment ID",
    }),
});
