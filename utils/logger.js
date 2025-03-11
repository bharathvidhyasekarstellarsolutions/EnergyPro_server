const winston = require("winston");
const { transports, createLogger, format } = winston;
const DailyRotateFile = require("winston-daily-rotate-file");
const fs = require("fs");
const path = require("path");

const logFormat = winston.format.printf(
  ({ timestamp, level, message, service }) => {
    return `${timestamp} ${level} [${service || "general"}]: ${message}`;
  }
);

const getTimeUntilNextRun = (hour, minute = 0) => {
  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setHours(hour, minute, 0, 0);
  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  return targetTime - now;
};

const ensureLogDirectoryExists = () => {
  const logDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
};

// Function to delete yesterday's logs and ensure today's log file is created if not exists
const deleteYesterdayLogs = () => {
  // console.log("Calling the function deleteYesterdayLogs :: ");

  ensureLogDirectoryExists();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedDate = yesterday.toISOString().split("T")[0];
  const logDir = path.join(__dirname, "../logs");

  // console.log("Searching for logs with date: ", formattedDate);

  try {
    const files = fs.readdirSync(logDir);
    let deletedFiles = 0;
    files.forEach((file) => {
      if (file.includes(formattedDate)) {
        const filePath = path.join(logDir, file);
        // console.log(`File found: ${filePath}`);
        fs.unlinkSync(filePath);
        // console.log(`Deleted log: ${file}`);
        deletedFiles++;
      }
    });

    if (deletedFiles === 0) {
      // console.log(`No logs found for yesterday's date: ${formattedDate}`);
    } else {
      // console.log(`Deleted ${deletedFiles} log(s).`);
    }

    // Ensure today's log files (service-specific) exist for each service
    const today = new Date().toISOString().split("T")[0];
    const services = ["auth", "product", "user", "order"];

    services.forEach((service) => {
      const todayLogFile = path.join(logDir, `${service}-${today}.log`);

      if (!fs.existsSync(todayLogFile)) {
        // console.log(
        //   `Today's log file for ${service} doesn't exist, creating it now: ${todayLogFile}`
        // );
        // Create the log file if it doesn't exist
        getServiceLogger(service).info("Created today's log file.");
      } else {
        // console.log(
        //   `Today's log file for ${service} already exists, no need to create it.`
        // );
      }
    });
  } catch (err) {
    console.error("Error during file deletion or log creation: ", err);
  }
};

const targetHour = 1; // Set this to the hour when you want the task to run
const targetMinute = 10; // Set this to the minute of the hour

const timeUntilNextRun = getTimeUntilNextRun(targetHour, targetMinute);

setTimeout(() => {
  // console.log("Calling the function for the first run :: ");
  deleteYesterdayLogs(); // Run once to delete yesterday's logs
  setInterval(deleteYesterdayLogs, 24 * 60 * 60 * 1000); // Run every 24 hours to delete old logs
}, timeUntilNextRun);

// DailyRotateFile transport for general logs
const dailyRotateTransport = new DailyRotateFile({
  filename: "logs/%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxFiles: "1d",
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), logFormat),
});

// General logger
const logger = createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    dailyRotateTransport,
    new transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: "debug",
    }),
  ],
});

// Function to create a service logger
const getServiceLogger = (service) => {
  return createLogger({
    level: "debug",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format((info) => {
        info.service = service;
        return info;
      })(),
      logFormat
    ),
    transports: [
      new DailyRotateFile({
        filename: `logs/${service}-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        zippedArchive: false,
        maxFiles: "1d",
        level: "debug",
        format: winston.format.combine(winston.format.timestamp(), logFormat),
      }),
      new transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
        level: "debug",
      }),
    ],
  });
};

deleteYesterdayLogs();
// Initialize service-specific loggers
const authLogger = getServiceLogger("auth");
const productLogger = getServiceLogger("product");
const userLogger = getServiceLogger("user");
const orderLogger = getServiceLogger("order");

module.exports = {
  logger,
  getServiceLogger,
  authLogger,
  productLogger,
  userLogger,
  orderLogger,
};
