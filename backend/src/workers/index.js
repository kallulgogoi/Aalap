const { startEmailWorkers } = require("./emailWorker");
const { startGarbageCollection } = require("./cleanupWorker");

/**
 * Initializes all background workers and cron jobs.
 * This should be called exactly once during server startup.
 */
const initializeWorkers = () => {
  console.log("⚙️ Booting up background workers...");

  // Start the RabbitMQ listeners
  // Note: Ensure this is called AFTER RabbitMQ has successfully connected in server.js
  startEmailWorkers();

  // Start the Cron Jobs
  startGarbageCollection();
};

module.exports = { initializeWorkers };
