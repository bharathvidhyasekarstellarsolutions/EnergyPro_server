const { User } = require("../models");
const { logger, userLogger } = require("../utils/logger");

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    userLogger.info("Fetching all users...");
    const users = await User.find().populate("role");
    if (!users || users.length === 0) {
      userLogger.warn("No users found in the database.");
      return res.status(404).json({ message: "No users found" });
    }
    userLogger.info(`Successfully fetched ${users.length} users.`);
    res.status(200).json({
      users: users.map((user) => ({
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
      })),
    });
  } catch (error) {
    userLogger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Users By Roles
exports.getUsersByRole = async (req, res) => {
  const { role } = req.query;
  try {
    if (!role) {
      userLogger.warn("Role parameter missing in the query.");
      return res
        .status(400)
        .json({ message: "Role is required in the query parameter" });
    }

    userLogger.info(`Fetching users with role: ${role}`);

    const users = await User.find({ role });

    if (users.length === 0) {
      userLogger.warn(`No users found with role: ${role}`);
      return res
        .status(404)
        .json({ message: `No users found with role: ${role}` });
    }

    userLogger.info(
      `Successfully fetched ${users.length} users with role: ${role}`
    );

    res.status(200).json({
      users: users.map((user) => ({
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
      })),
    });
  } catch (error) {
    userLogger.error(`Error fetching users by role: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// get by user id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    userLogger.info(`Fetching user with ID: ${id}`);

    const user = await User.findById(id);

    if (!user) {
      userLogger.warn(`User with ID: ${id} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    userLogger.info(`Successfully fetched user with ID: ${id}`);

    res.status(200).json({
      user,
    });
  } catch (error) {
    userLogger.error(
      `Error fetching user with ID: ${req.params.id}. Error: ${error.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
};

// update the user by id
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      username,
      email,
      address,
      firstName,
      lastName,
      companyName,
      phoneNumber,
      ...updateData
    } = req.body;

    userLogger.info(`Start updating user with ID: ${userId}`);

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      userLogger.error(`User with ID: ${userId} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    if (
      updateData.orderHistory ||
      updateData.password ||
      updateData.cart ||
      updateData.email ||
      updateData.role ||
      updateData.paymentInfo
    ) {
      userLogger.warn("Attempted to update restricted fields");
      return res
        .status(400)
        .json({ message: "Cannot update restricted fields" });
    }

    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists && usernameExists.id !== userId) {
        userLogger.warn(`Username already exists: ${username}`);
        return res.status(400).json({ message: "Username already exists" });
      }
      userLogger.info(`Username validation passed for: ${username}`);
      existingUser.username = username;
    }

    if (email && email !== existingUser.email) {
      userLogger.warn(
        `User attempting to change email from ${existingUser.email} to ${email}`
      );
      return res.status(403).json({ message: "Not allowed to change email" });
    }

    if (phoneNumber) {
      existingUser.phoneNumber = phoneNumber;
      userLogger.info(`Phone number updated to: ${phoneNumber}`);
    }
    if (firstName) {
      existingUser.firstName = firstName;
      userLogger.info(`First Name updated to: ${firstName}`);
    }
    if (lastName) {
      existingUser.lastName = lastName;
      userLogger.info(`Last Name updated to: ${lastName}`);
    }
    if (companyName) {
      existingUser.companyName = companyName;
      userLogger.info(`Company Name updated to: ${companyName}`);
    }

    if (address && Array.isArray(address)) {
      for (let addr of address) {
        if (addr._id) {
          const existingAddressIndex = existingUser.address.findIndex(
            (a) => a._id.toString() === addr._id.toString()
          );

          if (existingAddressIndex >= 0) {
            existingUser.address[existingAddressIndex] = {
              ...existingUser.address[existingAddressIndex],
              ...addr,
            };
          } else {
            existingUser.address.push(addr);
          }
        } else if (addr.label) {
          const existingAddressIndex = existingUser.address.findIndex(
            (a) => a.label === addr.label
          );

          if (existingAddressIndex >= 0) {
            existingUser.address[existingAddressIndex] = {
              ...existingUser.address[existingAddressIndex],
              ...addr,
            };
          } else {
            existingUser.address.push(addr);
          }
        } else {
          console.warn("Address missing both _id and label. Skipping address.");
        }
      }
    }

    Object.keys(updateData).forEach((key) => {
      if (existingUser[key] !== undefined) {
        existingUser[key] = updateData[key];
      }
    });

    const updatedUser = await existingUser.save();

    userLogger.info(`User with ID: ${userId} updated successfully`);

    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        phoneNumber: updatedUser.phoneNumber,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    userLogger.error(
      `Error updating user with ID: ${req.params.id}. Error: ${error.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
};

// Remove address from a user
exports.removeAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    const { addressId } = req.body;

    userLogger.info(`Start removing address for user with ID: ${userId}`);

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      userLogger.error(`User with ID: ${userId} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    if (!addressId) {
      userLogger.warn("Address ID not provided");
      return res.status(400).json({ message: "Address ID is required" });
    }

    const existingAddressIndex = existingUser.address.findIndex(
      (a) => a._id.toString() === addressId.toString()
    );

    if (existingAddressIndex === -1) {
      userLogger.warn(`Address with ID: ${addressId} not found`);
      return res.status(404).json({ message: "Address not found" });
    }

    existingUser.address.splice(existingAddressIndex, 1);

    const updatedUser = await existingUser.save();

    userLogger.info(`Address with ID: ${addressId} removed successfully`);

    res.json({
      message: "Address removed successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    userLogger.error(
      `Error removing address for user with ID: ${req.params.id}. Error: ${error.message}`
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Users By ID
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    userLogger.info(`Start deleting user with ID: ${userId}`);

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      userLogger.warn(`User with ID: ${userId} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    userLogger.info(`User with ID: ${userId} deleted successfully`);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    userLogger.error(
      `Error deleting user with ID: ${req.params.id}. Error: ${error.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
};
