const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default; // <-- Import the Redis Store adapter
const redisClient = require("../config/redis"); // <-- Import your Upstash Redis client

const {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Strict Auth Limiter (10 requests per 15 mins backed by Redis)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new RedisStore({
    // This tells the rate limiter exactly how to talk to Upstash
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/login", authLimiter, login);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;
