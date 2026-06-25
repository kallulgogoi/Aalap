const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRoutes = require("./routes"); // Pulls from routes/index.js
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// --- 1. GLOBAL MIDDLEWARE & SECURITY ---

// Helmet secures Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration (Crucial for Next.js frontend to communicate securely)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Allows cookies and authorization headers
  }),
);

// Body parsers (Allows Express to read JSON and URL-encoded data)
app.use(express.json({ limit: "10mb" })); // Limit JSON size to prevent payload DOS attacks
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- 2. ROUTING ---

// Mount all API routes under the /api prefix
app.use("/api", apiRoutes);

// Health Check Endpoint (AWS/Vercel/Render will ping this to ensure your server is alive)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// Fallback for non-existent routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Page Not Found" });
});

// --- 3. ERROR HANDLING ---

// MUST BE THE LAST MIDDLEWARE
app.use(errorHandler);

module.exports = app;
