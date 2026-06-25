const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      maxLength: [50, "Username cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Speeds up login and shadow message resolution queries
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Prevents password from being returned in standard queries
    },
    bio: {
      type: String,
      maxLength: [150, "Bio cannot exceed 150 characters"],
      default: "",
    },
    profilePic: {
      url: {
        type: String,
        default: "https://ui-avatars.com/api/?name=User&background=random", // Fallback default
      },
      publicId: {
        type: String,
        default: null, // Cloudinary cleanup algorithm
      },
    },
    isVerified: {
      type: Boolean,
      default: false, // Toggled to true after RabbitMQ OTP verification
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
