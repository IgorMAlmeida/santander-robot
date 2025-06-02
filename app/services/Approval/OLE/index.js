import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import logger from "../../../utils/logger.js";

export default async function approval(proposals, credentials) {
  logger.info("Starting OLE approval batch process", { 
    proposalCount: proposals.length, 
    username: credentials.username 
  });
  
  let { page, browser } = await initialize();

  logger.debug("Initiating login");
  const loginResult = await login(page, credentials);
  
  if (!loginResult.status) {
    logger.error("Failed to login to OLE approval system");
    await browser.close();
    return [];
  }

  let result = [];

  for (const proposal of proposals) {
    logger.info("Processing proposal", { proposalId: proposal.proposal });
    
    try {
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
      
      logger.debug("Initiating login after browser reinitialize");
      await login(page, credentials);
    }

    logger.info("Finished processing proposal", { proposalId: proposal.proposal });
  }

  logger.debug("Closing browser after completing all proposals");
  await browser.close();

  logger.info("OLE approval batch process complete", { 
    proposalCount: proposals.length, 
    successCount: result.filter(r => !r.error).length,
    errorCount: result.filter(r => r.error).length
  });

  return result;
}
