const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { createCourse,getCourses,deleteCourse,getInstructorCourse, updateCourse} = require("../controllers/courseController");


const router = express.Router();

// Accept both video and image files
router.post("/create", authMiddleware, upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "imageFile", maxCount: 1 },
  {name : "resourceFile",maxCount:1}
]), createCourse);
router.get("/getCourses",getCourses)

// instructor 
router.get("/instructorCourse/:id",roleMiddleware(["self"]),authMiddleware,getInstructorCourse)
router.put("/instructorCourse/update/:id", upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "imageFile", maxCount: 1 },
  { name: "resourceFile", maxCount: 1 }]),authMiddleware,updateCourse)

router.delete("/deleteCourse/:id",deleteCourse)
module.exports = router;
