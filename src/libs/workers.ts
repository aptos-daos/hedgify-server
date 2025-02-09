import { DaoCleanupWorker } from "../workers/dao.worker";
import { LikeQueueWorker } from "../workers/like-queue.worker";

const likeQueueWorker = new LikeQueueWorker();
const daoCleanUpWorker = new DaoCleanupWorker();

// likeQueueWorker
//   .start()
//   .then(() => console.log("⚡️[WORKER]: Like Queue Worker Started"))
//   .catch(console.error);

daoCleanUpWorker
  .start()
  .then(() => console.log("⚡️[WORKER]: Dao Cleanup Worker Started"))
  .catch(console.error);
