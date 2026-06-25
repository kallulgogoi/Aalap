const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { fetchChats, accessChat } = require("../controllers/chatController");

// Require JWT for all chat actions
router.use(protect);

// Chaining identical routes for cleaner code
router
  .route("/")
  .get(fetchChats) // Fetch all chats for the sidebar
  .post(accessChat); // Create a new 1-on-1 chat or return an existing one

module.exports = router;
