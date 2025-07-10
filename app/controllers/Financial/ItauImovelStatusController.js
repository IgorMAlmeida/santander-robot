// import { simulationQueue } from '../../../queue/simulationQueue.js';
import consult from '../../services/Financiamento/ItauImovel/consult.js';
import ControllerResponse from '../../utils/ControllerResponse.js';

export async function ItauImovelStatus(req, res) {
  try {
    const jobId = req.params.id || req.query.id;
    const job = await simulationQueue.getJob(jobId);
    let newJobId = 0;
    const state = await job.getState(simulationQueue, job.id);
    let result = job.returnvalue ?? null;
    if (state === 'failed' || (state === 'completed' && (result == null || result == 'Teste'))) {
        // console.log(`O job ${jobId} falhou, reiniciando...`);
        
        // const data = job.data;
        // const newJob = await simulationQueue.add('jobQueueSimulation', data);
    
        // console.log(`Novo job adicionado com ID: ${newJob.id}`);
        // newJobId = newJob.id;
        // result = newJobId;
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
