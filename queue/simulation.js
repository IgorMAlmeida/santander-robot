import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let myQueue = null;

if (process.env.USE_REDIS === 'true') {
  const connection = new IORedis({
    host: process.env.REDIS_NAME_INSTANCIA,
    port: 6379,
  });

  myQueue = new Queue('jobQueueSimulation', {
    connection
  });

  console.log('✅ Redis conectado e fila inicializada');
} else {
  console.log('⚠️ Redis desabilitado por configuração');
}

export async function listarJobs() {
  if (!myQueue) {
    console.warn('⚠️ Redis desabilitado. listJobs não está disponível.');
    return [];
  }

  const waiting = await myQueue.getJobs(['waiting']);
  const active = await myQueue.getJobs(['active']);
  const completed = await myQueue.getJobs(['completed']);
  const failed = await myQueue.getJobs(['failed']);

  return {
    waiting,
    active,
    completed,
    failed
  };
}

export async function listarJobId(id) {
  if (!myQueue) {
    console.warn('⚠️ Redis desabilitado. listarJobId não está disponível.');
    return null;
  }

  const job = await myQueue.getJob(id);

  if (!job) {
    console.log(`❌ Nenhum job encontrado com ID: ${id}`);
    return null;
  }

  const state = await job.getState();
  const result = job.returnvalue;
  const failedReason = job.failedReason;
  const json = job.data;

  console.log(`🆔 ID: ${job.id}`);
  console.log(`📌 Status: ${state}`);

  return { state, result, failedReason, json };
}

export async function removerJobPorId(id) {
  if (!myQueue) {
    console.warn('⚠️ Redis desabilitado. removerJobPorId não está disponível.');
    return false;
  }

  const job = await myQueue.getJob(id);

  if (!job) {
    console.log(`❌ Job com ID ${id} não encontrado.`);
    return false;
  }

  await job.remove();
  console.log(`🗑️ Job com ID ${id} removido com sucesso.`);
  return true;
}

export async function removerJobsAntigos(dataLimite) {
  if (!myQueue) {
    console.warn('⚠️ Redis desabilitado. removerJobsAntigos não está disponível.');
    return 0;
  }

  const estados = ['completed', 'failed', 'waiting', 'active'];
  let removidos = 0;

  for (const estado of estados) {
    const jobs = await myQueue.getJobs([estado], 0, 1000);
    for (const job of jobs) {
      if (job.timestamp < dataLimite.getTime()) {
        await job.remove();
        removidos++;
        console.log(`🧹 Removido job ID ${job.id} do estado '${estado}'`);
      }
    }
  }

  console.log(`✅ Total de jobs removidos: ${removidos}`);
  return removidos;
}