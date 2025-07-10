// import { Queue } from 'bullmq';
// import IORedis from 'ioredis';

let simulationQueue = null;

if (process.env.USE_REDIS === 'true') {
  const connection = new IORedis({
    host: process.env.REDIS_NAME_INSTANCIA || 'redis',
    port: 6379,
  });

  simulationQueue = new Queue('jobQueueSimulation', {
    connection
  });

  console.log('✅ Redis conectado e fila inicializada');
} else {
  console.log('⚠️ Redis desabilitado por configuração');
}

export { simulationQueue };