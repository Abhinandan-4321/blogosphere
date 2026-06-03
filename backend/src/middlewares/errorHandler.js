import { sendError } from "../utils/apiResponse.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, "Validation Error", errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `Duplicate value for field: ${field}`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Token expired");
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, 400, "File too large. Maximum size is 5MB");
  }

  // Multer unexpected field error
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return sendError(res, 400, "Unexpected file field");
  }

  // Multer field name size error
  if (err.code === "LIMIT_FIELD_KEY") {
    return sendError(res, 400, "Field name too long");
  }

  // Multer field value size error
  if (err.code === "LIMIT_FIELD_VALUE") {
    return sendError(res, 400, "Field value too long");
  }

  // Multer file count error
  if (err.code === "LIMIT_FILE_COUNT") {
    return sendError(res, 400, "Too many files");
  }

  // Multer generic error
  if (err.name === "MulterError") {
    return sendError(res, 400, err.message || "File upload error");
  }

  // Cloudinary storage errors
  if (err.storageErrors && Array.isArray(err.storageErrors)) {
    const cloudinaryError = err.storageErrors[0];
    return sendError(res, 400, cloudinaryError?.message || "Image upload failed");
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return sendError(res, statusCode, message);
};

export default errorHandler;
