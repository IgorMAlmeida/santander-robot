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
      `https://plataforma-emprestimo.bancomaster.com.br/emprestimo/acompanhamento-proposta`,
      { waitUntil: "domcontentloaded" }
    );
    
    await page.type('::-p-xpath(//*[@id="mat-input-2"])', proposal.proposal);
    await clickElementByXpath(
      page,
      "/html/body/app-root/app-home-v2/app-side-bar/mat-sidenav-container/mat-sidenav-content/mat-card/app-acompanhamento-propostas/form/mat-card/div[1]/div/div/div/mat-button-toggle-group/button[3]"
    );
    console.log(`Pesquisou a proposta ${proposal.proposal}`);

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
