const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Course = sequelize.define("Course", {
    courseId: {
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
      validate: {
        isEmail: true, // Ensures valid email format
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // Supports decimal pricing
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageFile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resourceFile:{
      type:DataTypes.STRING,
      allowNull:true,
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users", // Ensure this matches the actual table name
        key: "id",
      },
    },
  });

  // ✅ Correctly define a static method to find a course by authorEmail
  Course.findByEmail = async function (email) {
    return await this.findOne({ where: { authorEmail: email } });
  };
 
  return Course;
};
