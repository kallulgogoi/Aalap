const mongoose = require("mongoose");
const { generateDefaultAvatar } = require("../utils/avatar");

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
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    bio: {
      type: String,
      maxLength: [150, "Bio cannot exceed 150 characters"],
      default: "",
    },
    profilePic: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", function () {
  if (!this.profilePic?.url) {
    const seed = this.email || this.username;
    this.profilePic = {
      url: generateDefaultAvatar(this.username, seed),
      publicId: null,
    };
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
