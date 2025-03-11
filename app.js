require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { logger } = require("./utils/logger");
const indexRoutes = require("./routes/indexRoute");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use("/v1/api", indexRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Stellar E-commerce API");
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong! Please try again later." });
});

const shutdown = () => {
  console.log("Closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.warn(`Port ${PORT} is already in use. Trying another port...`);
    const newPort = 3001;
    app.listen(newPort, () => {
      logger.info(`Server running on port ${newPort}`);
    });
  } else {
    logger.error("Error starting server:", err);
  }
});
