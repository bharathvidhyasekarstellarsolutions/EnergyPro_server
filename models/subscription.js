const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Subscription = sequelize.define("Subscription", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users", // Ensure this matches the actual Users table name
        key: "id",
      },
    },
    courses: {
      type: DataTypes.JSON, // ✅ Storing multiple courses as JSONB
      allowNull: false,
      defaultValue: {}, // Defaults to an empty object
    },
  });

  // ✅ Method to get all subscriptions for a user
  Subscription.getUserSubscriptions = async function (userId) {
    return await this.findAll({ where: { userId } });
  };

  return Subscription;
};
