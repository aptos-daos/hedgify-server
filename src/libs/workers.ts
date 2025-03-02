import { LikeQueueWorker } from "../workers/like-queue.worker";

const likeQueueWorker = new LikeQueueWorker();

// likeQueueWorker
//   .start()
//   .then(() => console.log("⚡️[WORKER]: Like Queue Worker Started"))
//   .catch(console.error);