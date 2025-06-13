import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";

/**
 * Processa as propostas de aprovação da OLE
 * @param {Array} proposals - Lista de propostas para aprovação
 * @param {Object} credentials - Credenciais de login
 * @returns {Promise<Array>} Resultado da aprovação
 */
export default async function approval(proposals, credentials) {
  logger.logMethodEntry('OLE.approval', { 
    proposalCount: proposals.length, 
    username: credentials.username,
    bankName: 'OLE'
  });
  
  let { page, browser } = await initialize();

  logger.debug("Iniciando processo de login na OLE", {
    username: credentials.username
  });
  
  const loginResult = await login(page, credentials);
  
  if (!loginResult.status) {
    logger.logError("Falha no login da OLE", new Error("Falha no processo de login"), {
      username: credentials.username
    });
    
    await browser.close();
    
    logger.logMethodExit('OLE.approval', [], {
      proposalCount: proposals.length,
      status: 'Falha',
      reason: 'Erro no login'
    });
    
    return [];
  }
  
  logger.debug("Login realizado com sucesso, iniciando processamento de propostas", {
    proposalCount: proposals.length,
    proposalIds: proposals.map(p => p.proposal)
  });

  let result = [];

  for (const proposal of proposals) {
    logger.info("Iniciando processamento de proposta", { 
      proposalId: proposal.proposal,
      bankName: 'OLE',
      postBackUrl: proposal.postBack.url
    });
    
    try {
      logger.debug("Iniciando processo de consulta e aprovação", { 
        proposalId: proposal.proposal
      });
      
      const consultStartTime = Date.now();
      const consultResult = await consult(page, proposal);
      const consultEndTime = Date.now();
      
      logger.info("Resultado da consulta e aprovação", { 
        proposalId: proposal.proposal, 
        status: consultResult.status, 
        message: consultResult.data,
        processingTimeMs: consultEndTime - consultStartTime
      });

      result.push({
        proposal: proposal.proposal,
        approved: consultResult.data,
        processingTimeMs: consultEndTime - consultStartTime
      });
    } catch (error) {
      logger.logError("Erro no processamento da proposta OLE", error, { 
        proposalId: proposal.proposal,
        url: page.url()
      });
      
      result.push({
        proposal: proposal.proposal,
        error: error.message,
      });

      // Reiniciar o navegador em caso de erro
      logger.debug("Fechando e reinicializando navegador após erro", {
        proposalId: proposal.proposal
      });
      
      await browser.close();
      
      logger.debug("Navegador fechado, iniciando nova instância");
      let recreate = await initialize();
      page = recreate.page;
      browser = recreate.browser;
      
      logger.debug("Nova instância do navegador inicializada, realizando login");
      await login(page, credentials);
    }

    logger.info("Proposta processada", { 
      proposalId: proposal.proposal,
      bankName: 'OLE',
      success: !result[result.length-1].error
    });
  }

  logger.debug("Fechando navegador após conclusão de todas as propostas");
  await browser.close();

  // Estatísticas finais
  const successCount = result.filter(r => !r.error).length;
  const errorCount = result.filter(r => r.error).length;
  
  logger.logMethodExit('OLE.approval', result, { 
    proposalCount: proposals.length, 
    successCount,
    errorCount,
    successRate: `${Math.round((successCount / proposals.length) * 100)}%`,
    bankName: 'OLE'
  });

  return result;
}
