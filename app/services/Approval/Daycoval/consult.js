import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";
import logger from "../../../utils/logger.js";

/**
 * consult
 * @description Consulta a proposta na tela de aprovação da Daycoval
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
  logger.info(`Starting Daycoval approval consultation`, { proposalId: proposal.proposal });
  
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
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );
    
    logger.info(`Current proposal status`, { status, proposalId: proposal.proposal });
    if (status !== "CHECKLIST PROMOTORA") {
      logger.warn(`Proposal is not in CHECKLIST PROMOTORA status`, { status, proposalId: proposal.proposal });
      throw new Error("Proposta não está na analise da CORBAN");
    }

    logger.debug(`Clicking on proposal link`);
    await clickElementByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );

    logger.debug(`Clicking approval button`);
    await clickElementByXpath(page, '//*[@id="BBApr_txt"]');

    logger.debug(`Waiting for approval confirmation`);
    await page.waitForSelector(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])'
    );

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
    logger.error(`Error during Daycoval approval process`, { 
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
