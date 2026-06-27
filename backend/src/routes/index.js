const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const chatRoutes = require("./chatRoutes");
const messageRoutes = require("./messageRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chats", chatRoutes);
router.use("/messages", messageRoutes);

module.exports = router;
