const cron = require("node-cron");
const Message = require("../models/Message");
const { deleteImage } = require("../services/cloudinary");

/**
 * The Garbage Collector
 * Runs automatically every night at 3:00 AM server time.
 */
const startGarbageCollection = () => {
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Running Nightly Garbage Collection...");

    try {
      // Find the cutoff date (24 hours ago)
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find all messages ready for hard deletion using the partial index we created
      const expiredMessages = await Message.find({
        isDeleted: true,
        deletedAt: { $lte: cutoffDate },
      });

      if (expiredMessages.length === 0) {
        console.log("✅ No expired messages to clean up.");
        return;
      }

      let deletedCount = 0;

      for (const msg of expiredMessages) {
        // 1. Wipe from Cloudinary if it contains media
        if (msg.publicId) {
          await deleteImage(msg.publicId);
        }

        // 2. Hard delete from MongoDB
        await Message.findByIdAndDelete(msg._id);
        deletedCount++;
      }

      console.log(
        `✅ Garbage Collection complete. Permanently removed ${deletedCount} messages.`,
      );
    } catch (error) {
      console.error("❌ Garbage Collection Failed:", error.message);
    }
  });
};

module.exports = { startGarbageCollection };
