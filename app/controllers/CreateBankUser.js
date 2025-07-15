import dotenv from 'dotenv';
import { 
  CreateController,
}from '../services/BMG/CreateUsers/CreateController.js';
dotenv.config();

const bankCreate = {
  BMG: (params) => CreateController(params),
};

export async function CreateBankUser(consultParams) {
  console.log("Iniciando processo de criação de usuário bancário...",consultParams);

  if (!consultParams || !consultParams.bank) {
    console.error("Parâmetros de consulta inválidos ou banco não especificado.");
    throw new Error("Banco não especificado nos parâmetros de consulta.");
  }

  const bankName = String(consultParams.bank).toUpperCase();
  const createFunction = bankCreate[bankName];
  console.log(`Função de desbloqueio encontrada para o banco: ${bankName}`, CreateController);

  if (typeof createFunction === 'function') {
    try {
      return await CreateController(consultParams);
    } catch (error) {
      console.error(`Erro ao executar a função de desbloqueio para o banco ${bankName}:`, error.response);
      throw error;
    }
  } else {
    console.warn(`Nenhuma estratégia de desbloqueio definida para o banco: ${consultParams.bank} (Normalizado: ${bankName})`);
    throw new Error(`Banco '${consultParams.bank}' não é suportado ou não possui uma estratégia de desbloqueio definida.`);
  }

}

