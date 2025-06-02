import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import logger from "../../../utils/logger.js";

export default async function verifySRCC(page, proposal, codeAgent) {
  logger.debug("Starting SRCC verification", { proposalId: proposal, codeAgent });
  
  try {
    logger.debug("Navigating to proposal analysis page");
    await page.goto(
      `https://desenv.facta.com.br/sistemaNovo/propostaAnalise.php?codigo=${proposal}&corretor=${codeAgent}`
    );

    await sleep(2000);

    logger.debug("Clicking SRCC history button");
    await clickElementByXpath(page, '//*[@id="btnCarregaHistoricoSRCC"]');

    await sleep(1000);

    logger.debug("Reading SRCC history content");
    const divText = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]');

    if (divText === "Não foram encontrados resultados para sua pesquisa.") {
      logger.debug("No SRCC results found", { proposalId: proposal });
      return true;
    }

    logger.debug("Checking SRCC flag value");
    const srccTd = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]/table/tbody/tr/td[3]');
    logger.debug("SRCC flag value", { srccValue: srccTd });

    if (!srccTd || srccTd === 'N') {
      logger.debug("SRCC flag is negative or empty, proceeding", { proposalId: proposal });
      return true;
    }

    logger.warn("SRCC flag is positive, cannot proceed", { proposalId: proposal, srccValue: srccTd });
    return false;
  } catch (err) {
    logger.error("Error during SRCC verification", { 
      proposalId: proposal, 
      error: err.message,
      stack: err.stack
    });
    return false;
  }
}