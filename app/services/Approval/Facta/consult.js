import { clickElementByXpath, sleep } from "../../../../utils.js";
import verifySRCC from "./verifySRCC.js";
import APIService from "../APIService.js";

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
  try {
    await page.goto(
      `https://desenv.facta.com.br/sistemaNovo/andamentoPropostas.php`,
      { waitUntil: "domcontentloaded" }
    );
    
    await page.type('::-p-xpath(//*[@id="codigoAf"])', proposal.proposal);
    await clickElementByXpath(page, '//*[@id="aguardandoAprovacaoEsteira"]');
    await clickElementByXpath(page, '//*[@id="pesquisar"]');

    await sleep(500);

    await verifySRCC(page);

    await clickElementByXpath(
      page,
      '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      2000
    );

    await sleep(1000);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Enter");
    await sleep(500);
    await page.keyboard.press("Enter");

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
      data: error.message,
    };
  }
}

