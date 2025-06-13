import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";
import { getCodeAgent } from "./codeAgent.js";

/**
 * Processa as propostas de aprovação da Facta
 * @param {Array} proposals - Lista de propostas para aprovação
 * @param {Object} credentials - Credenciais de login
 * @returns {Promise<Array>} Resultado da aprovação
 */
export default async function approval(proposals, credentials) {
  logger.logMethodEntry('Facta.approval', { 
    proposalCount: proposals.length, 
    username: credentials.username,
    bankName: 'Facta'
  });
  
  let { page, browser } = await initialize();

  logger.debug("Iniciando processo de login na Facta", {
    username: credentials.username
  });
  
  const loginResult = await login(page, credentials);
  
  if (!loginResult.status) {
    logger.logError("Falha no login da Facta", new Error(loginResult.data || "Falha no processo de login"), {
      username: credentials.username
    });
    
    await browser.close();
    
    logger.logMethodExit('Facta.approval', []);
    
    return [];
  }

  const codeAgent = await getCodeAgent(page);
  
  logger.debug("Login realizado com sucesso, iniciando processamento de propostas");

  let result = [];

  for (const proposal of proposals) {
    logger.info("Iniciando processamento de proposta", { 
      proposalId: proposal.proposal,
      bankName: 'Facta',
      postBackUrl: proposal.postBack.url
    });
    
    try {
      logger.debug("Iniciando processo de consulta e aprovação");
      
      const consultResult = await consult(page, proposal, codeAgent);
      
      logger.info("Resultado da consulta e aprovação");

      result.push({
        proposal: proposal.proposal,
        approved: consultResult.data,
      });
    } catch (error) {
      logger.logError("Erro no processamento da proposta Facta", error);
      
      result.push({
        proposal: proposal.proposal,
        error: error.message,
      });

      logger.debug("Fechando navegador após erro");
    }

    logger.info("Proposta processada", { 
      proposalId: proposal.proposal,
      bankName: 'Facta',
      success: !result[result.length-1].error
    });
  }

  logger.debug("Fechando navegador após conclusão de todas as propostas");
  await browser.close();

  // Estatísticas finais
  const successCount = result.filter(r => !r.error).length;
  const errorCount = result.filter(r => r.error).length;
  
  logger.logMethodExit('Facta.approval', result, { 
    proposalCount: proposals.length, 
    successCount,
    errorCount,
    successRate: `${Math.round((successCount / proposals.length) * 100)}%`,
    bankName: 'Facta'
  });

  return result;
}
