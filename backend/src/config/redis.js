const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URI, {
  maxRetriesPerRequest: 3,

  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Force a reconnect if Redis goes into read-only mode during a failover
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

module.exports = redisClient;
