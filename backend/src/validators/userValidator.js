import Joi from "joi";

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(500).optional().allow(""),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(""),
  preferred2FA: Joi.string().valid("email", "sms").optional(),
  is2FAEnabled: Joi.boolean().optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    "string.min": "New password must be at least 6 characters",
    "any.required": "New password is required",
  }),
});
