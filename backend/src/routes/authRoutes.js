const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const redisClient = require("../config/redis");

const {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// 10 req per 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new RedisStore({
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
