import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";

/**
 * Processa as propostas de aprovação do Daycoval
 * @param {Array} proposals - Lista de propostas para aprovação
 * @param {Object} credentials - Credenciais de login
 * @returns {Promise<Array>} Resultado da aprovação
 */
export async function approval(proposals, credentials) {
  logger.logMethodEntry('Daycoval.approval', { 
    proposalCount: proposals.length, 
    username: credentials.username,
    bankName: 'Daycoval'
  });
  
  let { page, browser } = await initialize();

  logger.debug("Iniciando processo de login no Daycoval", {
    username: credentials.username
  });
  
  const loginResult = await login(page, credentials);
  
  if (!loginResult.status) {
    logger.logError("Falha no login do Daycoval", new Error(loginResult.data || "Falha no login"), {
      username: credentials.username
    });
    
    await browser.close();
    
    logger.logMethodExit('Daycoval.approval', [], {
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
      bankName: 'Daycoval',
      postBackUrl: proposal.postBack.url
    });
    
    try {
      const consultationUrl = `https://consignado.daycoval.com.br/Autorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx`;
      
      logger.debug("Navegando para página de consulta de aprovações", {
        url: consultationUrl,
        waitUntil: "domcontentloaded",
        timeout: 30000
      });
      
      const navigationStartTime = Date.now();
      await page.goto(
        consultationUrl,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        }
      );
      const navigationEndTime = Date.now();
      
      logger.debug("Navegação concluída", {
        navigationTimeMs: navigationEndTime - navigationStartTime,
        currentUrl: page.url()
      });

      const currentUrl = page.url();
      if (currentUrl.includes("login") || currentUrl.includes("Login")) {
        logger.info("Sessão expirada, realizando novo login", {
          currentUrl,
          bankName: 'Daycoval'
        });

        logger.debug("Iniciando processo de re-login");
        const reLoginResult = await login(page, credentials);
        
        if (!reLoginResult.status) {
          const error = new Error(reLoginResult.data || "Falha no re-login");
          logger.logError("Falha no processo de re-login Daycoval", error, {
            username: credentials.username,
            currentUrl
          });
          throw error;
        }
        
        logger.debug("Re-login realizado com sucesso");

        logger.debug("Navegando para página de consulta após re-login", {
          url: consultationUrl,
          waitUntil: "domcontentloaded",
          timeout: 30000
        });
        
        const reNavStartTime = Date.now();
        await page.goto(
          consultationUrl,
          {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          }
        );
        const reNavEndTime = Date.now();
        
        logger.debug("Navegação após re-login concluída", {
          navigationTimeMs: reNavEndTime - reNavStartTime,
          currentUrl: page.url()
        });
      }

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
      logger.logError("Erro no processamento da proposta Daycoval", error, { 
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
      bankName: 'Daycoval',
      success: !result[result.length-1].error
    });
  }

  logger.debug("Fechando navegador após conclusão de todas as propostas");
  await browser.close();

  // Estatísticas finais
  const successCount = result.filter(r => !r.error).length;
  const errorCount = result.filter(r => r.error).length;
  
  logger.logMethodExit('Daycoval.approval', result, { 
    proposalCount: proposals.length, 
    successCount,
    errorCount,
    successRate: `${Math.round((successCount / proposals.length) * 100)}%`
  });

  return result;
}
