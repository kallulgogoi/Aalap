const { startEmailWorkers } = require("./emailWorker");
const { startGarbageCollection } = require("./cleanupWorker");

const initializeWorkers = () => {
  console.log("Booting up background workers...");

  startEmailWorkers();

  startGarbageCollection();
};

module.exports = { initializeWorkers };
