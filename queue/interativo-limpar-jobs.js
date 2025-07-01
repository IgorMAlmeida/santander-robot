import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import inquirer from 'inquirer';

const connection = new IORedis({
  host: process.env.REDIS_NAME_INSTANCIA,
  port: 6379,
});

const myQueue = new Queue('jobQueueSimulation', { connection });

async function listarJobsPorEstado(estado) {
  const jobs = await myQueue.getJobs([estado], 0, 1000);
  return jobs.map(job => ({
    name: `ID: ${job.id} | Criado: ${new Date(job.timestamp).toLocaleString()} | Estado: ${estado}`,
    value: job,
  }));
}

async function iniciarMenu() {
  const { estadoSelecionado } = await inquirer.prompt([
    {
      type: 'list',
      name: 'estadoSelecionado',
      message: 'Escolha o estado dos jobs que deseja visualizar/remover:',
      choices: ['waiting', 'active', 'completed', 'failed'],
    },
  ]);

  const jobs = await listarJobsPorEstado(estadoSelecionado);

  if (jobs.length === 0) {
    console.log(`⚠️ Nenhum job encontrado no estado '${estadoSelecionado}'.`);
    return;
  }

  const { jobsSelecionados } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'jobsSelecionados',
      message: 'Selecione os jobs que deseja remover:',
      choices: jobs,
      pageSize: 10,
    },
  ]);

  for (const job of jobsSelecionados) {
    await job.remove();
    console.log(`🗑️ Job ID ${job.id} removido com sucesso.`);
  }

  console.log(`✅ Total removido: ${jobsSelecionados.length}`);
  process.exit(0);
}

iniciarMenu().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
