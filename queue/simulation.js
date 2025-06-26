import { Queue, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
    host: 'localhost',
    port: 6379,
  });

const myQueue = new Queue('jobQueueSimulation', {
  connection
});

export async function listarJobs() {
  let waiting = await myQueue.getJobs(['waiting']);
  let active = await myQueue.getJobs(['active']);
  let completed = await myQueue.getJobs(['completed']);
  let failed = await myQueue.getJobs(['failed']);

  return [
    waiting = waiting,
    active = active,
    completed = completed,
    failed = failed
  ]
}

export async function listarJobId(id) {
    const job = await myQueue.getJob(id);
  
    if (!job) {
      console.log(`❌ Nenhum job encontrado com ID: ${id}`);
      return;
    }
  
    let state = await job.getState();
    let result = await job.returnvalue;
    let failedReason = job.failedReason;
    let json = job.data;
  
    console.log(`🆔 ID: ${job.id}`);
    console.log(`📌 Status: ${state}`);
  
    return [
        state = state,
        result = result,
        failedReason = failedReason,
        json = json
    ]
}
  
export async function removerJobPorId(id) {
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
  const estados = ['completed', 'failed', 'waiting', 'active'];
  let removidos = 0;

  for (const estado of estados) {
    const jobs = await myQueue.getJobs([estado], 0, 1000); // limite máximo de 1000 jobs por estado
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

  
