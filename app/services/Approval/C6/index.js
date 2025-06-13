import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";

/**
 * Processa as propostas de aprovação da C6
 * @param {Array} proposals - Lista de propostas para aprovação
 * @param {Object} credentials - Credenciais de login
 * @returns {Promise<Array>} Resultado da aprovação
 */
export async function approval(proposals, credentials) {
  logger.logMethodEntry('C6.approval', { 
    proposalCount: proposals.length, 
    username: credentials.username,
    bankName: 'C6'
  });
  
  let { page, browser } = await initialize();
  let FISession = null;
  let result = [];

  logger.debug("Iniciando processamento de propostas C6", {
    totalPropostas: proposals.length,
    proposalIds: proposals.map(p => p.proposal)
  });

  for (const proposal of proposals) {
    logger.info("Iniciando processamento de proposta", { 
      proposalId: proposal.proposal,
      bankName: 'C6',
      postBackUrl: proposal.postBack.url
    });
    
    try {
      if (!FISession) {
        logger.debug("Sessão não encontrada, iniciando login", { 
          username: credentials.username 
        });
        
        const loginData = await login(page, credentials);

        if (!loginData.status) {
          const error = new Error(loginData.data || "Falha no login");
          logger.logError("Falha no processo de login C6", error, {
            username: credentials.username
          });
          throw error;
        }

        FISession = loginData.data;
        logger.debug("Login realizado com sucesso, FISession obtida", { 
          FISession,
          sessionLength: FISession ? FISession.length : 0
        });
      }

      const consultationUrl = `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`;
      
      logger.debug("Navegando para página de consulta de aprovações", {
        url: consultationUrl,
        waitUntil: "networkidle0",
        timeout: 30000
      });
      
      await page.goto(consultationUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const currentUrl = page.url();
      logger.debug("URL atual após navegação", { currentUrl });
      
      if (currentUrl.includes("login") || currentUrl.includes("Login")) {
        logger.info("Sessão expirada, realizando novo login", {
          currentUrl,
          bankName: 'C6'
        });
        
        FISession = null;

        const loginData = await login(page, credentials);
        if (!loginData.status) {
          const error = new Error(loginData.data || "Falha no re-login");
          logger.logError("Falha no processo de re-login C6", error, {
            username: credentials.username,
            currentUrl
          });
          throw error;
        }

        FISession = loginData.data;
        logger.debug("Re-login realizado com sucesso, nova FISession obtida", { 
          FISession,
          sessionLength: FISession ? FISession.length : 0
        });

        logger.debug("Navegando para página de consulta após re-login", {
          url: consultationUrl
        });
        
        await page.goto(consultationUrl, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });
      }

      logger.debug("Iniciando processo de consulta e aprovação", { 
        proposalId: proposal.proposal 
      });
      
      const consultResult = await consult(page, proposal);

      logger.info("Resultado da consulta e aprovação", { 
        proposalId: proposal.proposal, 
        status: consultResult.status, 
        message: consultResult.data 
      });

      result.push({
        proposal: proposal.proposal,
        approved: consultResult.data,
      });
    } catch (error) {
      logger.logError("Erro no processamento da proposta C6", error, { 
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
      FISession = null;
      
      logger.debug("Nova instância do navegador inicializada");
    }

    logger.info("Proposta processada", { 
      proposalId: proposal.proposal,
      bankName: 'C6',
      success: !result[result.length-1].error
    });
  }

  logger.debug("Fechando navegador após conclusão de todas as propostas");
  await browser.close();

  // Estatísticas finais
  const successCount = result.filter(r => !r.error).length;
  const errorCount = result.filter(r => r.error).length;
  
  logger.logMethodExit('C6.approval', result, { 
    proposalCount: proposals.length, 
    successCount,
    errorCount,
    successRate: `${Math.round((successCount / proposals.length) * 100)}%`
  });

  return result;
}
