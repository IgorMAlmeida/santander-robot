import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import verifySRCC from "./verifySRCC.js";
import APIService from "../APIService.js";
import justNumbers from "../../../utils/justNumbers.js";
import search from "./search.js";
import logger from "../../../utils/logger.js";

/**
 * consult
 * @description Consulta a proposta na tela de aprovação da Facta
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
  logger.info(`Starting Facta approval consultation`, { proposalId: proposal.proposal });
  
  try {
    logger.debug("Getting agent code");
    const codeAgent = await getElementTextByXpath(page, '//*[@id="corpo"]/header/div/div/div/div[2]/span');
    const codeAgentText = justNumbers(codeAgent);
    logger.debug("Agent code retrieved", { codeAgent: codeAgentText });

    if (!codeAgentText) {
      logger.warn("Agent code not found");
      throw new Error("Código do agente não encontrado");
    }

    logger.debug("Verifying SRCC status", { 
      proposalId: proposal.proposal, 
      agentCode: codeAgentText 
    });
    const isValidSRCC = await verifySRCC(page, proposal.proposal, codeAgentText);

    if (!isValidSRCC) {
      logger.warn("Proposal has SRCC record", { proposalId: proposal.proposal });
      throw new Error("Proposta possui registro de SRCC");
    }
    logger.info("SRCC verification passed", { proposalId: proposal.proposal });

    logger.debug("Searching for proposal", { proposalId: proposal.proposal });
    await search(page, proposal.proposal);

    logger.debug("Clicking approval button");
    await clickElementByXpath(
      page,
      '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      5000
    );

    await sleep(1000);

    logger.debug("Confirming approval action");
    await clickElementByXpath(
      page,
      '//*[@id="modalAprovacaoEsteira"]/div/div/div[2]/div/div[3]/div/button[1]'
    );

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
    logger.error(`Error during Facta approval process`, { 
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
      data: error.message,
    };
  }
}

