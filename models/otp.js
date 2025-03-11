const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OtpTable = sequelize.define("OtpTable", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false }, // ❌ Remove unique if not necessary
    email: { type: DataTypes.STRING, allowNull: false, unique: true }, // ✅ Keep only one unique constraint
    otp: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  
  // Static method equivalent to `findByEmail`
  OtpTable.findByEmail = async function (email) {
    return await this.findOne({ where: { email } });
  };

  return OtpTable;
};
