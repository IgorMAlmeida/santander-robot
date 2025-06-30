import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_NAME_INSTANCIA,
  port: 6379,
});

const simulationQueue = new Queue('jobQueueSimulation', {
  connection
});

export { simulationQueue };
