const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  removeAddress,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// Route to get all users (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), getUsers);

// Route to get users by their role (only accessible by admin)
router.get("/roles", authMiddleware, roleMiddleware(["admin"]), getUsersByRole);

// Route to get a single user by ID (accessible by admin or the user themselves)
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "self"]),
  getUserById
);

// Route to update a user by ID (accessible by admin or the user themselves)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "self"]),
  updateUser
);

// Route to delete a user by ID (admin only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "self"]),
  deleteUser
);

// Route to delete a user by ID (admin only)
router.delete(
  "/address/:id",
  authMiddleware,
  roleMiddleware(["admin", "self"]),
  removeAddress
);

module.exports = router;
