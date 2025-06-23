import approval from '../../services/Approval/OLE/index.js';
import ControllerResponse from '../../utils/ControllerResponse.js';

export async function OLEApproval(req, res) {
    try {
        const proposals = req?.body?.proposals;
        const credentials = req?.body?.credentials;

        if (!proposals) {
            throw new Error("Faltou a proposta");
        }

        if (!credentials) {
            throw new Error("Faltou as credenciais");
        }

        const result = await approval(proposals, credentials);

        if (!result) {
            throw new Error("Erro ao processar a proposta");
        }

        return ControllerResponse.success(res, result);
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
}
