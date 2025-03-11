const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = require("../models/user")(sequelize); // Import User correctly
  
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
    authorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authorEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER, // Store course price
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING, // Store category
      allowNull: false,
    },
    videoFile: {
      type: DataTypes.STRING, // Store video file path
      allowNull: false,
    },
    imageFile: {
      type: DataTypes.STRING, // Store image file path
      allowNull: true,
    },
  });

  // Associate Course with User (Instructor)
  Course.belongsTo(User, { foreignKey: "instructorId", as: "instructor" });

  return Course;
};
