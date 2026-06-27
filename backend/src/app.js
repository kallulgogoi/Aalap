const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");
connectDB();
connectRabbitMQ();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Page Not Found" });
});

app.use(errorHandler);

module.exports = app;
