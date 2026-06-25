const User = require("../models/User");
const fs = require("fs");
const { uploadImage, deleteImage } = require("../services/cloudinary");

// Search for a user by email to start a chat
const searchUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email)
      return res
        .status(400)
        .json({ message: "Email query parameter required." });

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "-password",
    );

    // Crucial for the Shadow Message UI logic on the frontend
    if (!user) {
      return res.status(200).json({ success: true, exists: false });
    }

    res.status(200).json({ success: true, exists: true, user });
  } catch (error) {
    next(error);
  }
};

// Update Profile details & Avatar
const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    let updateFields = {};

    if (username) updateFields.username = username;
    if (bio) updateFields.bio = bio;

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

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

module.exports = { searchUser, updateProfile };
