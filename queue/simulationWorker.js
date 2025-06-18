import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import itauSimulation from '../app/services/Financiamento/ItauImovel/index.js';

const connection = new IORedis({
  host: 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const worker = new Worker('jobQueueSimulation', async (job) => {
  console.log(`🎯 Executando job ${job.id}`);

  try {
    let result;

    switch (job.data.bank) {
      case 'itau':
        result = await itauSimulation(job.data);
        break;
      default:
        throw new Error(`Banco "${job.data.bank}" não suportado.`);
    }

    if (!result.status) {
      console.error(`⚠️ Simulação falhou:`, result.message);
      throw new Error(result.message || 'Erro na simulação');
    }

    console.log('✅ Simulação realizada:', result.response);
    return result.response;
  } catch (err) {
    console.error('🔥 Erro no processamento do job:', err.message);
    throw err;
  }
}, { connection });
