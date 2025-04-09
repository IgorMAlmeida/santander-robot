import { clickElementByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";

/**
 * consult
 * @description Consulta a proposta na tela de aprovação da OLE
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
  try {
    await page.goto(
      `https://ola.oleconsignado.com.br/AtuacaoNaProposta/Index`,
      { waitUntil: "domcontentloaded" }
    );
    
    await page.type('::-p-xpath(//*[@id="NumeroProposta"])', proposal.proposal);
    await clickElementByXpath(
      page,
      "/html/body/div[2]/main/div/form/div[4]/div[1]/div[3]/div/table/tbody/tr[2]/td[1]/input"
    );

    await clickElementByXpath(page, '//*[@id="btnPesquisar"]');
    console.log('Pesquisou');

    await sleep(2000);

    await clickElementByXpath(page, '//*[@id="btnAprovar"]', 10000);
    console.log('Aprovou');

    await clickElementByXpath(page, '//*[@id="btnPopUpAprovarSim"]');
    console.log('Clicou no botão de aprovação');
    
    await sleep(1000);

    await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Aprovada" });

    return {
      status: true,
      data: `Proposta aprovada`,
    };
  } catch (error) {
    console.error(error)  

    await APIService.put(proposal.postBack.url, proposal.postBack.headers, { status: "Erro" });

    return { 
      status: false, 
      data: error.message
    };
  }
}
