const User = require("../models/User");
const fs = require("fs");
const { uploadImage, deleteImage } = require("../services/cloudinary");
const redisClient = require("../config/redis");
const { getIO } = require("../sockets/index");

// Search for a user by email to start a chat
const searchUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email)
      return res
        .status(400)
        .json({ message: "Email query parameter required." });

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        message: "You cannot start a chat with yourself.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "-password",
    );

    // Crucial for the Shadow Message UI logic on the frontend
    if (!user) {
      return res.status(200).json({ success: true, exists: false });
    }

    const socketId = await redisClient.get(`user:${user._id}`);
    const userObj = user.toObject();
    userObj.isOnline = !!socketId;

    res.status(200).json({ success: true, exists: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email)
      return res.status(400).json({ message: "Please provide an email" });

    // Find users matching the email (case-insensitive), but exclude the current logged-in user
    const users = await User.find({
      email: { $regex: email, $options: "i" },
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .limit(5);

    const usersWithPresence = await Promise.all(
      users.map(async (u) => {
        const socketId = await redisClient.get(`user:${u._id}`);
        const userObj = u.toObject();
        userObj.isOnline = !!socketId;
        return userObj;
      })
    );

    res.status(200).json(usersWithPresence);
  } catch (error) {
    res.status(500).json({ message: "Server error during search" });
  }
};
// Update Profile details & Avatar
const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    const updateFields = {};

    if (typeof username === "string" && username.trim()) {
      updateFields.username = username.trim();
    }

    if (typeof bio === "string") {
      updateFields.bio = bio.trim();
    }

    if (!Object.keys(updateFields).length && !req.file) {
      return res.status(400).json({ message: "No profile changes provided." });
    }

    // If the user uploaded a new profile picture via Multer
    if (req.file) {
      // 1. Upload new image to Cloudinary
      const result = await uploadImage(req.file.path, "chat_app_profiles");
      updateFields.profilePic = { url: result.url, publicId: result.publicId };

      // 2. Fetch the user's old image public_id
      const currentUser = await User.findById(req.user._id);

      // 3. Delete the old image from Cloudinary to save space
      if (currentUser.profilePic && currentUser.profilePic.publicId) {
        await deleteImage(currentUser.profilePic.publicId);
      }

      // 4. Cleanup local Multer file
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    try {
      getIO().emit("profile_updated", {
        userId: updatedUser._id,
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePic: updatedUser.profilePic,
      });
    } catch (socketErr) {
      console.warn("Profile update socket broadcast skipped:", socketErr.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

module.exports = { searchUser, updateProfile, searchUsers };
