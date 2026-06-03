import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { uploadCoverImage, uploadToCloudinary } from "../middlewares/upload.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const router = Router();

// @desc    Upload a single image (for inline blog content)
// @route   POST /api/upload/image
router.post("/image", authenticate, uploadCoverImage, async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No image file provided");
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "blog-app/inline",
    });
    return sendSuccess(res, 200, "Image uploaded successfully", { url: result.secure_url });
  } catch (error) {
    console.error("Image upload failed:", error.message);
    return sendError(res, 500, "Image upload failed");
  }
});

export default router;
