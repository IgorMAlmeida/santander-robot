import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";

/**
 * processData
 * @description Processa as propostas de aprovação da C6
 * @param {{
 *  proposal: string,
 *  postBack: {
 *    url: string,
 *    headers: Object,
 *  }
 * }} proposals - Propostas de aprovação
 * @param {{
 *  username: string,
 *  password: string,
 * }} credentials - Credenciais de login
 * @returns {Promise<Object>} Resultado da aprovação
 */

export async function approval(proposals, credentials) {
  logger.info("Starting C6 approval batch process", { 
    proposalCount: proposals.length, 
    username: credentials.username 
  });
  
  let { page, browser } = await initialize();
  let FISession = null;

  let result = [];

  for (const proposal of proposals) {
    logger.info("Processing proposal", { proposalId: proposal.proposal });
    
    try {
      if (!FISession) {
        logger.debug("No active session, initiating login");
        const loginData = await login(page, credentials);

        if (!loginData.status) {
          logger.error("Login failed", { error: loginData.data });
          throw new Error(loginData.data);
        }

        FISession = loginData.data;
        logger.debug("Login successful, obtained FISession", { FISession });
      }

      logger.debug("Navigating to approval consultation page");
      await page.goto(
        `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`,
        {
          waitUntil: "networkidle0",
          timeout: 30000,
        }
      );

      const currentUrl = page.url();
      if (currentUrl.includes("login") || currentUrl.includes("Login")) {
        logger.info("Session expired, logging in again");
        FISession = null;

        const loginData = await login(page, credentials);
        if (!loginData.status) {
          logger.error("Re-login failed", { error: loginData.data });
          throw new Error(loginData.data);
        }

        FISession = loginData.data;
        logger.debug("Re-login successful, obtained new FISession", { FISession });

        logger.debug("Navigating to approval consultation page after re-login");
        await page.goto(
          `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`,
          {
            waitUntil: "networkidle0",
            timeout: 30000,
          }
        );
      }

      logger.debug("Initiating consultation process", { proposalId: proposal.proposal });
      const consultResult = await consult(page, proposal);

      logger.info("Consultation complete", { 
        proposalId: proposal.proposal, 
        status: consultResult.status, 
        result: consultResult.data 
      });

      result.push({
        proposal: proposal.proposal,
        approved: consultResult.data,
      });
    } catch (error) {
      logger.error("Error processing proposal", { 
        proposalId: proposal.proposal, 
        error: error.message,
        stack: error.stack
      });
      
      result.push({
        proposal: proposal.proposal,
        error: error.message,
      });

      logger.debug("Closing and reinitializing browser after error");
      await browser.close();
      let recreate = await initialize();
      page = recreate.page;
      browser = recreate.browser;
      FISession = null;
    }

    logger.info("Finished processing proposal", { proposalId: proposal.proposal });
  }

  logger.debug("Closing browser after completing all proposals");
  await browser.close();

  logger.info("C6 approval batch process complete", { 
    proposalCount: proposals.length, 
    successCount: result.filter(r => !r.error).length,
    errorCount: result.filter(r => r.error).length
  });

  return result;
}
