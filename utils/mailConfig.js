const nodemailer = require("nodemailer");

exports.transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  logger: true,
  debug: true,
});

exports.transporter;
