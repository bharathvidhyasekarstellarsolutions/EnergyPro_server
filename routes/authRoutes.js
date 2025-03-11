const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

// Public routes
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/create-password", authController.createPassword);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/change-password", authController.changePassword);
router.post("/forget-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);


module.exports = router;
