import { clickElementByXpath, sleep } from "../../../../utils.js";
import verifySRCC from "./verifySRCC.js";
import APIService from "../APIService.js";
import search from "./search.js";
import logger from "../../../utils/logger.js";

/**
 * Consulta a proposta na tela de aprovação da Facta
 * @param {Object} page - Instância da página do Puppeteer
 * @param {Object} proposal - Proposta de aprovação
 * @returns {Promise<Object>} Resultado da aprovação
 */
export async function consult(page, proposal, codeAgentText) {
  logger.logMethodEntry('Facta.consult');
  
  try { 
    await verifySRCC(page, proposal.proposal, codeAgentText);

    await search(page, proposal.proposal);

    logger.debug("Clicando no botão de aprovação");
    
    await clickElementByXpath(
      page,
      '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      5000
    );
    logger.debug("Botão de aprovação clicado");

    logger.debug("Aguardando resposta após clique");
    await sleep(1000);

    logger.debug("Confirmando ação de aprovação");
    
    await clickElementByXpath(
      page,
      '//*[@id="modalAprovacaoEsteira"]/div/div/div[2]/div/div[3]/div/button[1]'
    );
    
    logger.debug("Confirmação de aprovação concluída");

    logger.debug("Aguardando processamento da aprovação");
    await sleep(1000);

    logger.info(`Enviando status de aprovação para API`);
    await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Aprovada" });
    logger.info(`Resposta da API recebida`);

    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    logger.logError(`Erro durante processo de aprovação Facta`);

    try {
      logger.info(`Enviando status de erro para API`, { 
        proposalId: proposal.proposal,
        status: "Erro",
        url: proposal.postBack.url,
        errorMessage: error.message
      });
      
      await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Erro" });
      
      logger.debug(`Status de erro enviado para API`);
    } catch (apiError) {
      logger.logError(`Erro ao enviar status de erro para API`, apiError);
    }

    return { 
      status: false,
      data: error.message,
    };
  }
}

