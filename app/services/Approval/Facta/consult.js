import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import verifySRCC from "./verifySRCC.js";
import APIService from "../APIService.js";
import justNumbers from "../../../utils/justNumbers.js";
import search from "./search.js";
import logger from "../../../utils/logger.js";

/**
 * Consulta a proposta na tela de aprovação da Facta
 * @param {Object} page - Instância da página do Puppeteer
 * @param {Object} proposal - Proposta de aprovação
 * @returns {Promise<Object>} Resultado da aprovação
 */
export async function consult(page, proposal) {
  logger.logMethodEntry('Facta.consult', { 
    proposalId: proposal.proposal,
    postBackUrl: proposal.postBack.url
  });
  
  try {
    logger.debug("Obtendo código do agente", {
      xpath: '//*[@id="corpo"]/header/div/div/div/div[2]/span'
    });
    
    await sleep(2000);

    const startTimeAgentCode = Date.now();
    const codeAgent = await getElementTextByXpath(page, '//*[@id="corpo"]/header/div/div/div/div[2]/span');
    const codeAgentText = justNumbers(codeAgent);
    const endTimeAgentCode = Date.now();
    
    logger.debug("Código do agente recuperado", { 
      codeAgent: codeAgentText,
      originalText: codeAgent,
      timeToGetCodeMs: endTimeAgentCode - startTimeAgentCode
    });

    if (!codeAgentText) {
      logger.warn("Código do agente não encontrado", {
        proposalId: proposal.proposal,
        originalText: codeAgent
      });
      throw new Error("Código do agente não encontrado");
    }

    logger.debug("Verificando status SRCC", { 
      proposalId: proposal.proposal, 
      agentCode: codeAgentText 
    });
    
    const startTimeSRCC = Date.now();
    const isValidSRCC = await verifySRCC(page, proposal.proposal, codeAgentText);
    const endTimeSRCC = Date.now();
    
    logger.debug("Verificação SRCC concluída", {
      result: isValidSRCC,
      timeToVerifyMs: endTimeSRCC - startTimeSRCC
    });

    if (!isValidSRCC) {
      logger.warn("Proposta possui registro SRCC", { 
        proposalId: proposal.proposal,
        agentCode: codeAgentText
      });
      throw new Error("Proposta possui registro de SRCC");
    }
    
    logger.info("Verificação SRCC aprovada", { 
      proposalId: proposal.proposal,
      timeToVerifyMs: endTimeSRCC - startTimeSRCC
    });

    logger.debug("Pesquisando proposta", { 
      proposalId: proposal.proposal 
    });
    
    const startTimeSearch = Date.now();
    await search(page, proposal.proposal);
    const endTimeSearch = Date.now();
    
    logger.debug("Pesquisa de proposta concluída", {
      proposalId: proposal.proposal,
      timeToSearchMs: endTimeSearch - startTimeSearch
    });

    logger.debug("Clicando no botão de aprovação", {
      xpath: '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      timeout: 5000
    });
    
    const startTimeApproval = Date.now();
    await clickElementByXpath(
      page,
      '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      5000
    );
    const endTimeApproval = Date.now();
    
    logger.debug("Botão de aprovação clicado", {
      timeToClickMs: endTimeApproval - startTimeApproval
    });

    logger.debug("Aguardando resposta após clique", {
      tempoEspera: 1000
    });
    await sleep(1000);

    logger.debug("Confirmando ação de aprovação", {
      xpath: '//*[@id="modalAprovacaoEsteira"]/div/div/div[2]/div/div[3]/div/button[1]'
    });
    
    await clickElementByXpath(
      page,
      '//*[@id="modalAprovacaoEsteira"]/div/div/div[2]/div/div[3]/div/button[1]'
    );
    
    logger.debug("Confirmação de aprovação concluída");

    logger.debug("Aguardando processamento da aprovação", {
      tempoEspera: 1000
    });
    await sleep(1000);

    logger.info(`Enviando status de aprovação para API`, { 
      proposalId: proposal.proposal, 
      status: "Aprovada",
      url: proposal.postBack.url,
      headers: Object.keys(proposal.postBack.headers).join(', ')
    });
    
    const apiStartTime = Date.now();
    const apiResponse = await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Aprovada" });
    const apiEndTime = Date.now();
    
    logger.info(`Resposta da API recebida`, {
      proposalId: proposal.proposal,
      responseData: apiResponse,
      apiResponseTimeMs: apiEndTime - apiStartTime
    });

    logger.logMethodExit('Facta.consult', { 
      status: true, 
      data: 'Proposta aprovada' 
    }, {
      proposalId: proposal.proposal,
      agentCode: codeAgentText
    });
    
    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    logger.logError(`Erro durante processo de aprovação Facta`, error, { 
      proposalId: proposal.proposal,
      url: page.url()
    });

    try {
      logger.info(`Enviando status de erro para API`, { 
        proposalId: proposal.proposal,
        status: "Erro",
        url: proposal.postBack.url,
        errorMessage: error.message
      });
      
      const apiErrorStartTime = Date.now();
      await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Erro" });
      const apiErrorEndTime = Date.now();
      
      logger.debug(`Status de erro enviado para API`, {
        proposalId: proposal.proposal,
        apiResponseTimeMs: apiErrorEndTime - apiErrorStartTime
      });
    } catch (apiError) {
      logger.logError(`Erro ao enviar status de erro para API`, apiError, {
        proposalId: proposal.proposal,
        url: proposal.postBack.url
      });
    }

    return { 
      status: false,
      data: error.message,
    };
  }
}

