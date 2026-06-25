const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections in the pool
      serverSelectionTimeoutMS: 5000, //try to connect for 5s, then throw error
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6 first to speed up DNS resolution
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to auto-reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB Runtime Error: ${err.message}`);
});

module.exports = connectDB;
