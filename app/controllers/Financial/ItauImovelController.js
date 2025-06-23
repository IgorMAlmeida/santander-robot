import ControllerResponse from '../../utils/ControllerResponse.js';
import { simulationQueue } from '../../../queue/simulationQueue.js';

export async function ItauImovelFinancial(req, res) {
    try {
        const data = req?.body?.data;

        if (!data) {
            throw new Error("Faltou os dados da proposta");
        }

        const job = await simulationQueue.add('jobQueueSimulation', data);
        return ControllerResponse.success(res, {
            message: 'Simulação enfileirada',
            jobId: job.id
          });
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
}
