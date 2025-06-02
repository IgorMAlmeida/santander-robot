import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";
import logger from "../../../utils/logger.js";

/**
 * consult
 * @description Consulta a proposta na tela de aprovação da C6
 * @param {{
 *  page: Object,
 *  proposal: {
 *    proposal: string,
 *    postBack: {
 *      url: string,
 *      headers: Object,
 *    }
 *  }
 * }} proposal - Proposta de aprovação
 * @returns {Promise<Object>} Resultado da aprovação
 */
export async function consult(page, proposal) {
  logger.info(`Starting C6 approval consultation`, { proposalId: proposal.proposal });
  
  try {
    logger.debug(`Entering proposal ID in search field`, { proposalId: proposal.proposal });
    await page.type(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])',
      proposal.proposal
    );
    
    logger.debug(`Clicking search button`);
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');

    await sleep(1000);
    
    logger.debug(`Checking proposal status`);
    const status = await getElementTextByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta_ctl02_ctl02"]'
    );
    
    logger.info(`Current proposal status`, { status });
    if (status !== "ANALISE CORBAN") {
      logger.warn(`Proposal is not in CORBAN analysis status`, { status, proposalId: proposal.proposal });
      throw new Error("Proposta não está na analise da CORBAN");
    }

    logger.debug(`Navigating through form with Tab key`);
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
    }

    logger.debug(`Pressing Enter to select proposal`);
    await page.keyboard.press("Enter");

    logger.debug(`Clicking on approval tab`);
    await clickElementByXpath(page, '//*[@id="__tab_ctl00_Cph_TBCP_2"]');
    await sleep(500);

    logger.debug(`Clicking on approval button`);
    await clickElementByXpath(page, '//*[@id="BBApr_txt"]');

    logger.debug(`Waiting for approval confirmation`);
    await page.waitForSelector('::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])');

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
    logger.error(`Error during C6 approval process`, { 
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
