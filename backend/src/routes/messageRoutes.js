const express = require("express");
const router = express.Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const redisClient = require("../config/redis");

const { protect } = require("../middlewares/authMiddleware");
const {
  fetchMessages,
  sendMessage,
  sendShadowMessage,
  uploadMessageMedia,
  softDeleteMessage,
  restoreMessage,
} = require("../controllers/msgController");

const upload = multer({ dest: "uploads/" });

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
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

router.get("/:chatId", fetchMessages);
router.post("/", sendMessage);
router.post("/shadow", sendShadowMessage);
router.post("/upload", upload.single("chatImage"), uploadMessageMedia);
router.put("/:id/delete", softDeleteMessage);
router.put("/:id/restore", restoreMessage);

module.exports = router;
