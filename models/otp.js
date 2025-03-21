const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OtpTable = sequelize.define("OtpTable", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    otp: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: "otptables", // ✅ Explicitly set the table name
    timestamps: true, // ✅ Ensures createdAt and updatedAt are handled
  });

  OtpTable.findByEmail = async function (email) {
    return await this.findOne({ where: { email } });
  };

  return OtpTable;
};
