const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // https
});

/**
 * Uploads an image stream to Cloudinary
 * @param {String} filePath - The local path of the uploaded file (via multer)
 * @param {String} folder - The destination folder in Cloudinary
 * @returns {Object} - Contains the secure_url and public_id
 */
const uploadImage = async (filePath, folder = "chat_app_profiles") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [
        { width: 500, height: 500, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    throw new Error("Failed to upload image to cloud storage.");
  }
};

/**
 * Used for profile picture cleanup
 * @param {String} publicId - The cloudinary public ID of the image to delete
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
      console.warn(`Cloudinary deletion failed for publicId: ${publicId}`);
    }
  } catch (error) {
    console.error("Cloudinary Delete Error:", error.message);
  }
};

module.exports = { uploadImage, deleteImage };
