const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Subscription Routes
router.post("/set-course",authMiddleware, subscriptionController.createSubscription);
router.get("/get-course/:id",
    authMiddleware,
    roleMiddleware(["self"]), subscriptionController.getUserSubscriptions);
router.put("/add-course",authMiddleware, subscriptionController.addCourseToSubscription);
router.put("/remove-course",authMiddleware, subscriptionController.removeCourseFromSubscription);

module.exports = router;    
