import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import itauSimulation from '../app/services/Financiamento/ItauImovel/index.js';
import bradescoSimulation from '../app/services/Financiamento/BradescoImovel/index.js';
import daycovalSimulation from '../app/services/Financiamento/DaycovalImovel/index.js';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.USE_REDIS);
if (process.env.USE_REDIS === 'true') {

  const connection = new IORedis({
    host: process.env.REDIS_NAME_INSTANCIA,
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

        case 'bradesco':
          result = await bradescoSimulation(job.data);
          break;
        
        case 'daycoval':
          result = await daycovalSimulation(job.data);
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
  console.log('✅ Redis conectado e fila inicializada');
} else {
  console.log('⚠️ Redis desabilitado por configuração');
}
