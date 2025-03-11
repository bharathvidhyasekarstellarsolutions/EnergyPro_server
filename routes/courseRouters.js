const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { createCourse } = require("../controllers/courseController");

const router = express.Router();

// Accept both video and image files
router.post("/create", authMiddleware, upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "imageFile", maxCount: 1 }
]), createCourse);

module.exports = router;
