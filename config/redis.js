const redis = require("redis");

let redisClient;

const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Redis connection error:", error);
    // Create a fallback in-memory client if Redis fails
    return null;
  }
};

// Initialize Redis
let isRedisReady = false;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await initRedis();
    isRedisReady = true;
  }
  return redisClient;
};

// Generic cache functions
const setCache = async (key, value, ttl = 300) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Set cache error:", error);
    return false;
  }
};

const getCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Get cache error:", error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (error) {
    console.error("Delete cache error:", error);
    return false;
  }
};

const flushCache = async () => {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.flushAll();
    return true;
  } catch (error) {
    console.error("Flush cache error:", error);
    return false;
  }
};

module.exports = {
  redisClient,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  flushCache,
};
