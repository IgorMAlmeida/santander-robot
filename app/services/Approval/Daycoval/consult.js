import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import APIService from "../APIService.js";

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
  try {
    await page.type(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])',
      proposal.proposal
    );
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');

    await sleep(1000);
    const status = await getElementTextByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );
    if (status !== "CHECKLIST PROMOTORA") {
      throw new Error("Proposta não está na analise da CORBAN");
    }

    await clickElementByXpath(
      page,
      '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[11]/a'
    );

    await clickElementByXpath(page, '//*[@id="BBApr_txt"]');

    await page.waitForSelector(
      '::-p-xpath(//*[@id="ctl00_Cph_AprCons_l_Titulo"])'
    );

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
