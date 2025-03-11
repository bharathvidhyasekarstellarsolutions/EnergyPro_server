const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load environment variables

// Initialize Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST ,
    port:3306,
      dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 3000,
      idle: 1000,
    },
  }
);

// Test Connection
sequelize
  .authenticate()
  .then(() => console.log("Connected to MySQL"))
  .catch((err) => console.error("Error connecting to MySQL:", err));

// Import Models
const User = require("./user")(sequelize);
const OtpTable = require("./otp")(sequelize);

  

module.exports = {
  sequelize,
  User,
  OtpTable,
};
