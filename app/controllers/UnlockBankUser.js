import dotenv from 'dotenv';
import { 
  UnlockController,
  // UnlockMaster
}
  from '../services/UnlockUsers/BMG/UnlockController.js';
dotenv.config();

const bankUnlock = {
  // MASTER:() => UnlockMaster(),
  // BMG:() => UnlockController(),
  BMG: (params) => UnlockController(params),
};

export async function UnlockBankUser(consultParams) {
  console.log("Iniciando processo de desbloqueio de usuário bancário...",consultParams);

  if (!consultParams || !consultParams.bank) {
    console.error("Parâmetros de consulta inválidos ou banco não especificado.");
    throw new Error("Banco não especificado nos parâmetros de consulta.");
  }

  const bankName = String(consultParams.bank).toUpperCase();
  const unlockFunction = bankUnlock[bankName];
  console.log(`Função de desbloqueio encontrada para o banco: ${bankName}`, unlockFunction);

  if (typeof unlockFunction === 'function') {
    try {
      return await unlockFunction(consultParams);
    } catch (error) {
      console.error(`Erro ao executar a função de desbloqueio para o banco ${bankName}:`, error.message);
      throw error;
    }
  } else {
    console.warn(`Nenhuma estratégia de desbloqueio definida para o banco: ${consultParams.bank} (Normalizado: ${bankName})`);
    throw new Error(`Banco '${consultParams.bank}' não é suportado ou não possui uma estratégia de desbloqueio definida.`);
  }

}

