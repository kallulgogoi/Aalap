const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const { searchUser, updateProfile } = require("../controllers/userController");

const upload = multer({ dest: "uploads/" });

router.use(protect);

router.get("/search", searchUser);

router.put("/profile", upload.single("profilePic"), updateProfile);

module.exports = router;
