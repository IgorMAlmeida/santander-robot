import { clickElementByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";
import logger from "../../../utils/logger.js";

/**
 * Consulta a proposta na tela de aprovação da OLE
 * @param {Object} page - Instância da página do Puppeteer
 * @param {Object} proposal - Proposta de aprovação
 * @returns {Promise<Object>} Resultado da aprovação
 */
export async function consult(page, proposal) {
  logger.logMethodEntry('OLE.consult', { 
    proposalId: proposal.proposal,
    postBackUrl: proposal.postBack.url
  });
  
  try {
    logger.debug("Navegando para página de aprovação da OLE", {
      url: 'https://ola.oleconsignado.com.br/AtuacaoNaProposta/Index',
      waitUntil: "domcontentloaded"
    });
    
    const navigationStartTime = Date.now();
    await page.goto(
      `https://ola.oleconsignado.com.br/AtuacaoNaProposta/Index`,
      { waitUntil: "domcontentloaded" }
    );
    const navigationEndTime = Date.now();
    
    logger.debug("Navegação concluída", {
      navigationTimeMs: navigationEndTime - navigationStartTime,
      currentUrl: page.url()
    });
    
    logger.debug(`Digitando ID da proposta no campo de pesquisa`, { 
      proposalId: proposal.proposal,
      selector: '::-p-xpath(//*[@id="NumeroProposta"])'
    });
    await page.type('::-p-xpath(//*[@id="NumeroProposta"])', proposal.proposal);
    
    logger.debug("Selecionando botão de rádio da proposta", {
      xpath: "/html/body/div[2]/main/div/form/div[4]/div[1]/div[3]/div/table/tbody/tr[2]/td[1]/input"
    });
    await clickElementByXpath(
      page,
      "/html/body/div[2]/main/div/form/div[4]/div[1]/div[3]/div/table/tbody/tr[2]/td[1]/input"
    );

    logger.debug("Clicando no botão de pesquisar", {
      xpath: '//*[@id="btnPesquisar"]'
    });
    await clickElementByXpath(page, '//*[@id="btnPesquisar"]');
    logger.info('Pesquisa de proposta concluída', {
      proposalId: proposal.proposal
    });

    logger.debug("Aguardando carregamento dos resultados", {
      tempoEspera: 2000
    });
    await sleep(2000);

    logger.debug("Clicando no botão de aprovação", {
      xpath: '//*[@id="btnAprovar"]',
      timeout: 10000
    });
    const approvalBtnStartTime = Date.now();
    await clickElementByXpath(page, '//*[@id="btnAprovar"]', 10000);
    const approvalBtnEndTime = Date.now();
    
    logger.info('Botão de aprovação clicado', {
      timeToClickMs: approvalBtnEndTime - approvalBtnStartTime
    });

    logger.debug("Confirmando ação de aprovação", {
      xpath: '//*[@id="btnPopUpAprovarSim"]'
    });
    await clickElementByXpath(page, '//*[@id="btnPopUpAprovarSim"]');
    logger.info('Confirmação de aprovação concluída');
    
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

    logger.logMethodExit('OLE.consult', { 
      status: true, 
      data: 'Proposta aprovada' 
    }, {
      proposalId: proposal.proposal,
      totalProcessingTimeMs: Date.now() - navigationStartTime
    });
    
    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    logger.logError(`Erro durante processo de aprovação OLE`, error, { 
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
      data: error.message
    };
  }
}
