const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const { searchUser, updateProfile } = require("../controllers/userController");

const upload = multer({ dest: "uploads/" });

// Require JWT for all user actions
router.use(protect);

// Search for a user by email
router.get("/search", searchUser);

// Update profile and optionally upload a new avatar
router.put("/profile", upload.single("profilePic"), updateProfile);

module.exports = router;
