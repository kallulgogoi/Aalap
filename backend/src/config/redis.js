const Redis = require("ioredis");

const redisOptions = {
  maxRetriesPerRequest: 3,

  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

const redisClient = new Redis(process.env.REDIS_URI, redisOptions);

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

// Factory to create fresh Redis clients for the Socket.io adapter (pub/sub)
const createRedisClient = () => {
  return new Redis(process.env.REDIS_URI, redisOptions);
};

module.exports = redisClient;
module.exports.createRedisClient = createRedisClient;

