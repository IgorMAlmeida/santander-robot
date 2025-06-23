import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: 'redis',
  port: 6379,
});

const simulationQueue = new Queue('jobQueueSimulation', {
  connection
});

export { simulationQueue };
