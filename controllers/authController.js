const nodemailer = require("nodemailer");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, OtpTable, sequelize } = require("../models");
const { authLogger } = require("../utils/logger");
const { transporter } = require("../utils/mailConfig");
const fs = require("fs");
const path = require("path");
const { where } = require("sequelize");
const { rootCertificates } = require("tls");
const { log } = require("console");

// generate otp
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// send otp
exports.sendOtp = async (req, res) => {
  try {
    let { email, username } = req.body;
    email = email.trim().toLowerCase();
    username = username.trim();

    authLogger.info(`Attempting to send OTP to ${email}`);

    // ✅ Check if user already exists in the database
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      authLogger.warn(`User with email ${email} already exists.`);
      return res.status(409).json({
        status: "error",
        message: "User already registered. Please login.",
      });
    }

    // ✅ Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Check if OTP already exists for the user
    let otpRecord = await OtpTable.findOne({ where: { email } });

    if (otpRecord) {
      await otpRecord.update({ otp, updatedAt: new Date() });
      authLogger.info(`Updated OTP for ${email}`);
    } else {
      otpRecord = await OtpTable.create({ username, email, otp });
      authLogger.info(`Created new OTP record for ${email}`);
    }

    // ✅ Prepare email template
    const templatePath = path.join(__dirname, "..", "templates", "otptemplate.html");
    let htmlContent = fs.readFileSync(templatePath, "utf8");
    htmlContent = htmlContent.replace("{{username}}", username).replace("{{otp}}", otp);

    // ✅ Send OTP via email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        authLogger.error(`Failed to send OTP to ${email}: ${error.message}`);
        await otpRecord.destroy();
        return res.status(500).json({ status: "error", message: "Failed to send OTP." });
      }

      authLogger.info(`OTP successfully sent to ${email}`);

      return res.status(200).json({
        status: "success",
        message: `OTP sent successfully to ${email}.`,
        user: {
          id: otpRecord.id,
          username: otpRecord.username,
          email: otpRecord.email,
        },
      });
    });

  } catch (error) {
    authLogger.error(`Error in sending OTP: ${error.message}`);
    return res.status(500).json({ status: "error", message: "Server error. Try again later." });
  }
};


// verify otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    authLogger.info(`OTP verification attempt for email: ${email}`);

    // ✅ Find OTP record
    const otpRecord = await OtpTable.findOne({ where: { email } });

    if (!otpRecord) {
      authLogger.warn(`No OTP record found for ${email}`);
      return res.status(400).json({ status: "error", message: "No OTP found. Please request a new one." });
    }

    // ✅ Check if OTP is expired
    const expirationTime = moment(otpRecord.createdAt).add(15, "minutes");
    if (moment().isAfter(expirationTime)) {
      authLogger.warn(`OTP expired for ${email}`);
      await otpRecord.destroy();
      return res.status(400).json({ status: "error", message: "OTP expired. Request a new one." });
    }

    // ✅ Compare OTP
    if (otp !== otpRecord.otp) {
      authLogger.warn(`Invalid OTP entered for ${email}`);
      return res.status(400).json({ status: "error", message: "Invalid OTP. Try again." });
    }
    

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      authLogger.warn(`User with email ${email} already exists.`);
      await otpRecord.destroy();
      return res.status(409).json({ status: "error", message: "User already registered. Please login." });
    }


    // ✅ Ensure valid user data
    if (!otpRecord.email || otpRecord.email !== email) {
      authLogger.error(`Mismatch or missing email in OTP record for ${email}`);
      return res.status(400).json({ status: "error", message: "Invalid user data. Please try again." });
    }
    // ✅ Create new user after OTP verification
    console.log(otpRecord.username)
    const newUser = await User.create({
      username: otpRecord.username,
      email: otpRecord.email,
      role: role , // Default role to "user" if not provided
    }); 


    // ✅ Delete OTP record after successful verification
    await otpRecord.destroy();

    authLogger.info(`User created successfully: ${newUser.username} (${newUser.email})`);

    return res.status(201).json({
      status: "success",
      message: "User verified and created successfully.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    authLogger.error(`Error in OTP verification for ${req.body.email}: ${error.message}`);
    console.log(error.message);

    // ✅ Handle specific Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ status: "error", message: "Validation error. Please check input data." });
    }

    return res.status(500).json({ status: "error", message: "Server error. Try again later." });
  }
};

// create password
exports.createPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate password length
    if (!password || password.length < 6) {
      authLogger.warn(`Password length validation failed for email: ${email}`);
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters long.",
      });
    }

    // Find user by email
    const user = await User.findOne({where: {email} });

    if (!user) {
      authLogger.warn(
        `User not found for email: ${email}. Prompting for OTP request.`
      );
      return res.status(404).json({
        status: "error",
        message: "User not found. Please request OTP again.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    authLogger.info(`Password hashed successfully for email: ${email}`);

    // Save the password
    user.password = hashedPassword;
    await user.save();

    authLogger.info(
      `Password successfully created for email: ${email}. User can now log in.`
    );

    res.status(200).json({
      status: "success",
      message: "Password created successfully. You can now log in.",
    });
  } catch (error) {
    authLogger.error(
      `Error in creating password for email: ${req.body.email}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      authLogger.warn(`Login attempt with missing email or password.`);
      return res.status(400).json({
        status: "error",
        message: "Please provide both email and password.",
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      authLogger.warn(`Login failed: User not found for email: ${email}`);
      return res.status(404).json({
        status: "error",
        message: "User not found. Please check your email or sign up.",
      });
    }

    // Compare provided password with stored password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      authLogger.warn(`Invalid password attempt for email: ${email}`);
      return res.status(400).json({
        status: "error",
        message: "Invalid password. Please try again.",
      });
    }

    // Generate JWT access token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m", // 15 minutes expiration for access token
    });

    // Generate JWT refresh token
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
      expiresIn: "7d",
    });

    // Store the refresh token in the database (if needed)
    user.refreshToken = refreshToken;
    await user.save();

    authLogger.info(`Login successful for email: ${email}`);

    res.status(200).json({
      status: "success",
      message: "Login successful.",
      refreshToken,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    authLogger.error(
      `Error during login for email: ${req.body.email}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// Refresh Token Endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    console.log("1--",refreshToken);
    

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "Refresh token is required.",
      });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            status: "error",
            message: "Invalid or expired refresh token.",
          });
        }

        // Find user with the provided refresh token
        const user = await User.findOne({ id: decoded.id, refreshToken });

        if (!user) {
          return res.status(404).json({
            status: "error",
            message: "User not found or refresh token does not match.",
          });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        // Generate new refresh token (optional but recommended)
        const newRefreshToken = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET_REFRESH,
          { expiresIn: "1d" }
        );

        // Update refresh token in the database (if needed)
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
          status: "success",
          message: "Refresh token successfully used.",
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      }
    );
  } catch (error) {
    authLogger.error(`Error during refresh token process: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, email } = req.body;
    authLogger.info(`Password change request received for email: ${email}`);

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      authLogger.warn(`User not found for email: ${email}`);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Compare old password with the stored password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      authLogger.warn(`Incorrect old password for email: ${email}`);
      return res.status(400).json({
        status: "error",
        message: "Old password is incorrect",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    authLogger.info(`New password hashed for email: ${email}`);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    authLogger.info(`Password changed successfully for email: ${email}`);

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    authLogger.error(
      `Error changing password for email: ${req.body.email}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// Request password reset (generate reset token)
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    authLogger.info(`Password reset request received for email: ${email}`);

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      authLogger.warn(`User not found for email: ${email}`);
      return res.status(404).json({
        status: "error",
        message: "User not found. Please check your email.",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    authLogger.info(`Reset token generated for email: ${email}`);

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    authLogger.info(`Reset link created: ${resetLink}`);

    // Use HTML template for the email content
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "passwordReset.html"
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");
    htmlContent = htmlContent
      .replace("{{username}}", user.username)
      .replace("{{resetLink}}", resetLink);

    // Prepare mail options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: htmlContent,
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      authLogger.info(`Password reset email sent successfully to ${email}`);
      return res.status(200).json({
        status: "success",
        message: "Password reset link sent to your email.",
      });
    } catch (error) {
      authLogger.error(
        `Error sending password reset email to ${email}: ${error.message}`
      );
      return res
        .status(500)
        .json({ status: "error", message: "Failed to send email" });
    }
  } catch (error) {
    authLogger.error(
      `Error in password reset request for email: ${req.body.email}: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};

// Handle password reset (verify token and set new password)
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    authLogger.info(`Password reset request received with token`);

    let decoded;
    // Verify the reset token
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      authLogger.info(
        `Reset token successfully verified for email: ${decoded.email}`
      );
    } catch (error) {
      authLogger.warn(`Invalid or expired reset token. Token: ${token}`);
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token.",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      authLogger.warn(`User not found for email: ${decoded.email}`);
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Validate new password length
    if (!newPassword || newPassword.length < 6) {
      authLogger.warn(
        `Password validation failed for email: ${decoded.email}. Password must be at least 6 characters.`
      );
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters long.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    authLogger.info(`New password hashed for email: ${decoded.email}`);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    authLogger.info(`Password reset successfully for email: ${decoded.email}`);

    res.status(200).json({
      status: "success",
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    authLogger.error(
      `Error in resetting password for token: ${req.body.token}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Server error. Please try again later.",
    });
  }
};
