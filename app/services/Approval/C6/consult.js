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
  logger.logMethodEntry('C6.consult', { 
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

    await sleep(1000);
    
    logger.debug(`Verificando status da proposta`, {
      xpath: '//*[@id="ctl00_Cph_AprCons_grdConsulta_ctl02_ctl02"]'
    });
    const status = await getElementTextByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta_ctl02_ctl02"]'
    );
    
    logger.info(`Status atual da proposta`, { 
      proposalId: proposal.proposal,
      status,
      expectedStatus: "ANALISE CORBAN"
    });
    
    if (status !== "ANALISE CORBAN") {
      logger.warn(`Proposta não está no status esperado de análise CORBAN`, { 
        proposalId: proposal.proposal, 
        currentStatus: status,
        expectedStatus: "ANALISE CORBAN"
      });
      throw new Error("Proposta não está na analise da CORBAN");
    }

    logger.debug(`Navegando pelo formulário usando Tab`, {
      proposalId: proposal.proposal,
      tabCount: 25
    });
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
    }

    logger.debug(`Pressionando Enter para selecionar a proposta`);
    await page.keyboard.press("Enter");

    logger.debug(`Clicando na aba de aprovação`, {
      xpath: '//*[@id="__tab_ctl00_Cph_TBCP_2"]'
    });
    await clickElementByXpath(page, '//*[@id="__tab_ctl00_Cph_TBCP_2"]');
    await sleep(500);

    logger.debug(`Clicando no botão de aprovação`, {
      xpath: '//*[@id="BBApr_txt"]'
    });
    await clickElementByXpath(page, '//*[@id="BBApr_txt"]');

    logger.debug(`Aguardando confirmação de aprovação`, {
      selector: '::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])'
    });
    await page.waitForSelector('::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])');

    logger.info(`Enviando status de aprovação para API`, { 
      proposalId: proposal.proposal, 
      status: "Aprovada",
      url: proposal.postBack.url,
      headers: Object.keys(proposal.postBack.headers).join(', ')
    });
    
    const apiResponse = await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Aprovada" });
    
    logger.info(`Resposta da API recebida`, {
      proposalId: proposal.proposal,
      responseData: apiResponse
    });

    logger.logMethodExit('C6.consult', { 
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
    logger.logError(`Erro durante processo de aprovação C6`, error, { 
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
      
      await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Erro" });
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
