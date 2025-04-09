import { approval } from '../../services/Approval/Daycoval/index.js';

export async function DaycovalApproval(req, res) {
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

    return res.status(200).json({
      status: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      error: error.message
    });
  }
};
