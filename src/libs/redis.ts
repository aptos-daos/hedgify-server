import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on("error", (err) => {
  console.error("⚡️[REDIS]: Redis Error", err);
});

redisClient.on("connect", () => {
  console.log("⚡️[REDIS]: Redis Connected Successful");
});

export default redisClient;
