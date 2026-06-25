const express = require("express");
const router = express.Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default; // Import adapter
const redisClient = require("../config/redis"); // Import your Redis client

const { protect } = require("../middlewares/authMiddleware");
const {
  fetchMessages,
  sendShadowMessage,
  uploadMessageMedia,
  softDeleteMessage,
  restoreMessage,
} = require("../controllers/msgController");

const upload = multer({ dest: "uploads/" });

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    success: false,
    message: "Too many requests sent. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(apiLimiter);

// Message Routes
router.get("/:chatId", fetchMessages);
router.post("/shadow", sendShadowMessage);
router.post("/upload", upload.single("chatImage"), uploadMessageMedia);
router.put("/:id/delete", softDeleteMessage);
router.put("/:id/restore", restoreMessage);

module.exports = router;
