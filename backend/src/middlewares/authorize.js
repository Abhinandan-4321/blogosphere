import { sendError } from "../utils/apiResponse.js";

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "You do not have permission to access this resource");
    }

    next();
  };
};
