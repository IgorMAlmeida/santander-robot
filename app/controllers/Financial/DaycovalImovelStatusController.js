import { simulationQueue } from '../../../queue/simulationQueue.js';
import ControllerResponse from '../../utils/ControllerResponse.js';
import consult from '../../services/Financiamento/DaycovalImovel/consult.js';

export async function DaycovalImovelStatus(req, res) {
  try {
    const jobId = req.params.id || req.query.id;
    const job = await simulationQueue.getJob(jobId);
    let newJobId = 0;
    const state = await job.getState(simulationQueue, job.id);
    let result = job.returnvalue ?? null;
    if (state === 'failed' || (state === 'completed' && result == 'Teste')) {
        console.log(`O job ${jobId} falhou, reiniciando...`);
        
        // Obter os dados do job original e adicionar novamente na fila
        const data = job.data; // Dados do job original
        const newJob = await simulationQueue.add('jobQueueSimulation', data);
    
        console.log(`Novo job adicionado com ID: ${newJob.id}`);
        newJobId = newJob.id;
        result = newJobId;
    } else if (state === 'completed') {
        const dados = await consult(result.Proposta);
        result.StatusFaseProposta = dados.response.StatusFaseProposta;
        result.Status = dados.response.Status;
        result.Motivo = dados.response.Motivo;
    }
    return ControllerResponse.success(res, { state, result });
  } catch (error) {
    return ControllerResponse.error(res, error);
  }
}
