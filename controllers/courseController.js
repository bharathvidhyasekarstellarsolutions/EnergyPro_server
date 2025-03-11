const Course = require("../models/course");

const createCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    // Ensure only instructors can create courses
    if (req.user.role !== "instructor") {
      return res.status(403).json({ error: "Access denied. Only instructors can create courses." });
    }

    // Ensure a video file is uploaded
    if (!req.files["videoFile"]) {
      return res.status(400).json({ error: "Please upload a video file" });
    }

    const newCourse = await Course.create({
      title,
      description,
      authorName: req.user.name,  
      authorEmail: req.user.email,  
      price,
      category,
      instructorId: req.user.id,
      videoFile: req.files["videoFile"][0].path, // Save video path
      imageFile: req.files["imageFile"] ? req.files["imageFile"][0].path : null, // Save image path if provided
    });

    res.status(201).json({ message: "Course created successfully!", course: newCourse });
  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createCourse };
