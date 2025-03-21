const multer = require("multer");
const path = require("path");
const fs = require("fs");




// Function to ensure directories exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";

    if (file.mimetype.startsWith("video/")) {
      uploadPath = "uploads/videos/";
    } else if (file.mimetype.startsWith("image/")) {
      uploadPath = "uploads/images/";
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype.startsWith("application/vnd")
    ) {
      uploadPath = "uploads/files/";
    } else {
      uploadPath = "uploads/others/"; // Optional: Handle unknown types separately
    }

    ensureDirExists(uploadPath); // Ensure the directory exists before saving
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});





const upload = multer({ storage });

module.exports = upload;
