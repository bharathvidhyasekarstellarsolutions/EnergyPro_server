const { where } = require("sequelize");
const { resource } = require("../app");
const { Course } = require("../models");
const { log } = require("winston");
const path = require("path")
const fs = require("fs");

const createCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    // Ensure only instructors can create courses
    if (!req.user || req.user.role !== "instructor") {
      return res.status(403).json({ error: "Access denied. Only instructors can create courses." });
    }

    // Ensure at least a video file is uploaded
    if (!req.files || !req.files["videoFile"]) {
      return res.status(400).json({ error: "Please upload a video file" });
    }
    

    // ✅ Get uploaded files
    const videoFile = req.files["videoFile"][0]?.path || null;
    const imageFile = req.files["imageFile"] ? req.files["imageFile"][0]?.path : null;
    const resourceFile = req.files?.["resourceFile"]?.[0]?.path || null;
    
    // ✅ Construct full URLs
    const serverUrl = `${req.protocol}://${req.get("host")}`;
    const videoUrl = videoFile ? `${serverUrl}/${videoFile.replace(/\\/g, "/")}` : null;
    const imageUrl = imageFile ? `${serverUrl}/${imageFile.replace(/\\/g, "/")}` : null;
    const resourceUrl = resourceFile ?  `${serverUrl}/${resourceFile.replace(/\\/g, "/")}` : null;

    // ✅ Create course
    const newCourse = await Course.create({
      title,
      description,
      authorName: req.user.username,
      authorEmail: req.user.email,
      price,
      category,
      instructorId: req.user.id,
      videoFile: videoUrl,
      imageFile: imageUrl,
      resourceFile:resourceUrl
    });

    res.status(201).json({ message: "Course created successfully!", course: newCourse });

  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const   getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();

    // ✅ Check if courses array is empty
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // ✅ Send response with courses data
    return res.status(200).json({
      message: "Success",
      data: courses
    });
  } catch (err) {
    console.error("Courses fetching error:", err);
    res.status(500).json({ error: "Courses fetching error" });
  }
};

const getInstructorCourse = async (req,res)=>{
  const {id}=req.params
  try {
    const courses = await Course.findAll({where:{instructorId:id}});

    // ✅ Check if courses array is empty
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // ✅ Send response with courses data
    return res.status(200).json({
      message: "Success",
      data: courses
    });
  } catch (err) {
    console.error("Courses fetching error:", err);
    res.status(500).json({ error: "Courses fetching error" });
  }
}
const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.resolve(filePath); // Get absolute path

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error("❌ Error deleting file:", err);
    } else {
      console.log("✅ File deleted successfully:", fullPath);
    }
  });
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category } = req.body;
    console.log("📂 Uploaded files:", req.files);
   
    // ✅ Ensure only instructors can update courses
    if (!req.user || req.user.role !== "instructor") {
      return res.status(403).json({ error: "Access denied. Only instructors can update courses." });
    }

    // ✅ Find the course
    let course = await Course.findOne({ where: { CourseId: id } });

    if (!course) {
      console.error("❌ Course not found for ID:", id);
      return res.status(404).json({ error: "Course not found." });
    }

    // ✅ Get server URL
    const serverUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Helper function to get local file path
    const getLocalFilePath = (fileUrl) => {
      if (!fileUrl) return null;

      const fileName = fileUrl.split("/").pop(); // Extract filename from URL
      return path.join(process.cwd(), "server/uploads", fileName); // Adjust path
    };

    // ✅ Check if new files exist and delete old ones
    if (req.files?.videoFile) {
      const videoFilePath = getLocalFilePath(course.videoFile);
      if (videoFilePath) deleteFile(videoFilePath);
    }
    
    if (req.files?.imageFile) {
      const imageFilePath = getLocalFilePath(course.imageFile);
      if (imageFilePath) deleteFile(imageFilePath);
    }
    
    if (req.files?.resourceFile) {
      const resourceFilePath = getLocalFilePath(course.resourceFile);
      if (resourceFilePath) deleteFile(resourceFilePath);
    }

    // ✅ Get new file paths (if uploaded)
    const videoFile = req.files?.videoFile?.[0]?.path || null;
    const imageFile = req.files?.imageFile?.[0]?.path || null;
    const resourceFile = req.files?.resourceFile?.[0]?.path || null;

    // ✅ Construct new URLs
    const videoUrl = videoFile ? `${serverUrl}/${videoFile.replace(/\\/g, "/")}` : course.videoFile;
    const imageUrl = imageFile ? `${serverUrl}/${imageFile.replace(/\\/g, "/")}` : course.imageFile;
    const resourceUrl = resourceFile ? `${serverUrl}/${resourceFile.replace(/\\/g, "/")}` : course.resourceFile;

    // ✅ Update course details
    const [updatedRows] = await Course.update(
      {
        title: title || course.title,
        description: description || course.description,
        price: price || course.price,
        category: category || course.category,
        videoFile: videoUrl,
        imageFile: imageUrl,
        resourceFile: resourceUrl,
      },
      { where: { CourseId: id } }
    );

    // ✅ Fetch updated course if changes were made
    if (updatedRows > 0) {
      course = await Course.findOne({ where: { CourseId: id } });      
      return res.status(200).json({ message: "✅ Course updated successfully!", course });
    } else {
      return res.status(400).json({ error: "⚠️ No changes were made to the course." });
    }
  } catch (error) {
    console.error("❌ Course update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params; // Get course ID from URL

    // ✅ Check if the course exists
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // ✅ Delete the course
    await course.destroy();

    // ✅ Send success response
    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: "Error deleting course" });
  }
};

module.exports = { createCourse, getCourses,deleteCourse,getInstructorCourse,updateCourse};
