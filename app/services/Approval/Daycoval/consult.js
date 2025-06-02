import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";
import logger from "../../../utils/logger.js";

/**
 * Consulta a proposta na tela de aprovação da Daycoval
 * @param {Object} page - Instância da página do Puppeteer
 * @param {Object} proposal - Proposta de aprovação
 * @returns {Promise<Object>} Resultado da aprovação
 */
export async function consult(page, proposal) {
  logger.logMethodEntry('Daycoval.consult', { 
    proposalId: proposal.proposal,
    postBackUrl: proposal.postBack.url
  });
  
  try {
    logger.debug(`Digitando ID da proposta no campo de pesquisa`, { 
      proposalId: proposal.proposal,
      selector: '::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])'
    });
    
    await page.type(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])',
      proposal.proposal
    );
    
    logger.debug(`Clicando no botão de pesquisar`, {
      xpath: '//*[@id="btnPesquisar_txt"]'
    });
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');

    logger.debug(`Aguardando resultados da pesquisa`, {
      tempoEspera: 1000
    });
    await sleep(1000);
    
    logger.debug(`Verificando status da proposta`, {
      xpath: '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    });
    
    const status = await getElementTextByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );
    
    logger.info(`Status atual da proposta`, { 
      proposalId: proposal.proposal,
      status,
      expectedStatus: "CHECKLIST PROMOTORA"
    });
    
    if (status !== "CHECKLIST PROMOTORA") {
      logger.warn(`Proposta não está no status esperado de CHECKLIST PROMOTORA`, { 
        proposalId: proposal.proposal, 
        currentStatus: status,
        expectedStatus: "CHECKLIST PROMOTORA"
      });
      throw new Error("Proposta não está na analise da CORBAN");
    }

    logger.debug(`Clicando no link da proposta`, {
      xpath: '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    });
    await clickElementByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );

    logger.debug(`Clicando no botão de aprovação`, {
      xpath: '//*[@id="BBApr_txt"]'
    });
    await clickElementByXpath(page, '//*[@id="BBApr_txt"]');

    logger.debug(`Aguardando confirmação de aprovação`, {
      selector: '::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])'
    });
    await page.waitForSelector(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])'
    );

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

    logger.logMethodExit('Daycoval.consult', { 
      status: true, 
      data: 'Proposta aprovada' 
    }, {
      proposalId: proposal.proposal
    });
    
    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    logger.logError(`Erro durante processo de aprovação Daycoval`, error, { 
      proposalId: proposal.proposal,
      url: proposal.postBack.url
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
