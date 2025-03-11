const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import DB connection
const User = require("./user"); // Import User model for association

const Course = sequelize.define("Course", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  videoFile: {
    type: DataTypes.STRING, // Stores file path or URL
    allowNull: false,
  },
  resourceFile: {
    type: DataTypes.STRING, // Optional resource file
    allowNull: true,
  },
});

// Associate Course with User (Instructor)
Course.belongsTo(User, { foreignKey: "instructorId", as: "instructor" });

module.exports = Course;
