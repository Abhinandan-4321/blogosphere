import Joi from "joi";

export const createBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title must not exceed 200 characters",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(10).required().messages({
    "string.min": "Content must be at least 10 characters",
    "any.required": "Content is required",
  }),
  excerpt: Joi.string().max(500).optional().allow(""),
  tags: Joi.alternatives()
    .try(Joi.array().items(Joi.string().trim()), Joi.string().allow(""))
    .optional()
    .allow(""),
  category: Joi.string().trim().optional(),
  visibility: Joi.string().valid("public", "private").optional(),
});

export const updateBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().max(500).optional().allow(""),
  tags: Joi.alternatives()
    .try(Joi.array().items(Joi.string().trim()), Joi.string().allow(""))
    .optional()
    .allow(""),
  category: Joi.string().trim().optional(),
  visibility: Joi.string().valid("public", "private").optional(),
});

export const updateVisibilitySchema = Joi.object({
  visibility: Joi.string().valid("public", "private").required().messages({
    "any.only": "Visibility must be either 'public' or 'private'",
    "any.required": "Visibility is required",
  }),
});
