const { DataTypes } = require("sequelize");
const { validate } = require("uuid");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    username: { type: DataTypes.STRING, allowNull: false, unique: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true},
    password: { type: DataTypes.STRING, allowNull: true },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // Static method to find user by email
  User.findByEmail = async function (email) {
    return await this.findOne({ where: { email } });
  };

  return User;
};
