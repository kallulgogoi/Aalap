const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { fetchChats, accessChat } = require("../controllers/chatController");

router.use(protect);

router.route("/").get(fetchChats).post(accessChat);

module.exports = router;
