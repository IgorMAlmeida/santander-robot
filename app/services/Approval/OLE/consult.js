import { clickElementByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";
import logger from "../../../utils/logger.js";


export async function consult(page, proposal) {
  logger.info(`Starting OLE approval consultation`, { proposalId: proposal.proposal });
  
  try {
    logger.debug("Navigating to OLE approval page");
    await page.goto(
      `https://ola.oleconsignado.com.br/AtuacaoNaProposta/Index`,
      { waitUntil: "domcontentloaded" }
    );
    
    logger.debug(`Entering proposal ID in search field`, { proposalId: proposal.proposal });
    await page.type('::-p-xpath(//*[@id="NumeroProposta"])', proposal.proposal);
    
    logger.debug("Selecting proposal radio button");
    await clickElementByXpath(
      page,
      "/html/body/div[2]/main/div/form/div[4]/div[1]/div[3]/div/table/tbody/tr[2]/td[1]/input"
    );

    logger.debug("Clicking search button");
    await clickElementByXpath(page, '//*[@id="btnPesquisar"]');
    logger.info('Proposal search completed');

    await sleep(2000);

    logger.debug("Clicking approval button");
    await clickElementByXpath(page, '//*[@id="btnAprovar"]', 10000);
    logger.info('Approval button clicked');

    logger.debug("Confirming approval action");
    await clickElementByXpath(page, '//*[@id="btnPopUpAprovarSim"]');
    logger.info('Approval confirmation completed');
    
    await sleep(1000);

    logger.info(`Sending approval status to API`, { 
      proposalId: proposal.proposal, 
      status: "Aprovada",
      url: proposal.postBack.url 
    });
    
    await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Aprovada" });

    logger.info(`Proposal successfully approved`, { proposalId: proposal.proposal });
    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    logger.error(`Error during OLE approval process`, { 
      proposalId: proposal.proposal,
      error: error.message,
      stack: error.stack
    });

    logger.info(`Sending error status to API`, { 
      proposalId: proposal.proposal,
      status: "Erro",
      url: proposal.postBack.url 
    });
    
    await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Erro" });

    return { 
      status: false, 
      data: error.message
    };
  }
}
