const { array } = require("../middlewares/uploadMiddleware");
const { Course, Subscription } = require("../models");
const { Sequelize, where } = require("sequelize");
const course = require("../models/course");

const createSubscription = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!req.user) {
      return res.status(403).json({ error: "Access denied. Please log in to subscribe." });
    }

    // Check if the course exists
    const course = await Course.findOne({ where: { courseid: courseId } });

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Find an existing subscription for the user
    let subscription = await Subscription.findOne({
      where: { userId: req.user.id },
    });

    const currentDate = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (subscription) {
      // ✅ Ensure courses is an array
      let updatedCourses;

      if (!subscription.courses) {
        updatedCourses = []; // Initialize if null
      } else if (typeof subscription.courses === "string") {
        updatedCourses = JSON.parse(subscription.courses); // Parse if string
      } else {
        updatedCourses = subscription.courses; // Already an object/array
      }

      // Find if the course is already in the subscription
      let courseIndex = updatedCourses.findIndex((c) => c.courseId === courseId);

      if (courseIndex !== -1) {
        let existingCourse = updatedCourses[courseIndex];

        // Check if subscription is still active
        let endedAt = new Date(existingCourse.endedAt);
        if (endedAt > currentDate) {
          return res.status(400).json({ error: "Course is currently active and cannot be renewed." });
        } else {
          // ✅ If expired, set `subscribed: false`
          existingCourse.subscribed = false;
          await subscription.update({ courses: JSON.stringify(updatedCourses) });

          return res.status(200).json({
            message: "Course subscription expired.",
            subscription,
          });
        }
      } else {
        // ✅ Add new course subscription
        updatedCourses.push({
          courseId,
          subscribed: true,
          startedAt: currentDate,
          endedAt: oneMonthLater,
        });

        await subscription.update({ courses: JSON.stringify(updatedCourses) });

        return res.status(200).json({
          message: "Subscription added successfully!",
          subscription,
        });
      }
    } else {
      // ✅ Create a new subscription if none exists
      subscription = await Subscription.create({
        userId: req.user.id,
        courses: JSON.stringify([
          {
            courseId,
            subscribed: true,
            startedAt: currentDate,
            endedAt: oneMonthLater,
          },
        ]), // Store as JSON
        createdAt: currentDate,
        updatedAt: currentDate,
      });

      return res.status(201).json({
        message: "Subscription created successfully!",
        subscription,
      });
    }
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};






const getUserSubscriptions = async (req, res) => {
  try {
    // Ensure only authenticated users can access their subscriptions
    const  id = req.params.id;
    if (!req.user) {
      return res.status(403).json({ error: "Access denied. Please log in." });
    }
    const subscription = await Subscription.findAll({ where: { userId: req.user.id } });
    if (!subscription || subscription.length<1) return res.status(500).json({message:"No record found"})
    if (!subscription || subscription.length === 0) {
        return res.status(404).json({ error: "No subscription found." });
      }
      
      // Access the first subscription object
      const subscriptionData = subscription[0].dataValues;
      
      // Parse the courses JSON string
      const courses = JSON.parse(subscriptionData.courses);
      
      if (!Array.isArray(courses) || courses.length === 0) {
        return res.status(404).json({ error: "No courses found in the subscription." });
      }
    
    // Flatten the array (because `findAll` returns an array for each course)
    const myCourses = await Course.findAll({
        where: {
            courseId: {
                [Sequelize.Op.in]: courses
                    .filter(e => e.subscribed) // Get only active subscriptions
                    .map(e => e.courseId) // Extract course IDs
            }
        }
    });    
    res.json({ myCourses,subscriptionData }); 
    
      
      
      
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const addCourseToSubscription = async (req, res) => {
  try {
    const { courseId, subscription, started, ended } = req.body;

    // Ensure only authenticated users can modify their subscriptions
    if (!req.user) {
      return res.status(403).json({ error: "Access denied. Please log in." });
    }

    const subscriptionEntry = await Subscription.findOne({ where: { userId: req.user.id } });

    if (!subscriptionEntry) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    let courses = subscriptionEntry.courses;
    courses[courseId] = { courseId, subscription, started, ended };

    subscriptionEntry.courses = courses;
    await subscriptionEntry.save();

    res.json({ message: "Course added to subscription", subscription: subscriptionEntry });

  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeCourseFromSubscription = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Ensure only authenticated users can modify their subscriptions
    if (!req.user) {
      return res.status(403).json({ error: "Access denied. Please log in." });
    }

    const subscriptionEntry = await Subscription.findOne({ where: { userId: req.user.id } });

    if (!subscriptionEntry) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    let courses = subscriptionEntry.courses;
    delete courses[courseId];

    subscriptionEntry.courses = courses;
    await subscriptionEntry.save();

    res.json({ message: "Course removed from subscription", subscription: subscriptionEntry });

  } catch (error) {
    console.error("Error removing course:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  addCourseToSubscription,
  removeCourseFromSubscription,
  
};
