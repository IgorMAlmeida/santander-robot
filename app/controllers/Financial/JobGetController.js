import ControllerResponse from '../../utils/ControllerResponse.js';
import { listarJobs, listarJobId } from '../../../queue/simulation.js';

export async function JobGetList (req, res) {
    try {

        const job = await listarJobs();
        return ControllerResponse.success(res, {
            message: 'Simulações',
            jobId: job
        });
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
}

export async function JobGetId (req, res) {
    try {

        const jobId = req.params.id || req.query.id;

        const job = await listarJobId(jobId);
        return ControllerResponse.success(res, {
            message: 'Simulação',
            jobId: job
        });
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
}
