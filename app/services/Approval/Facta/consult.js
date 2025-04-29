import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import verifySRCC from "./verifySRCC.js";
import APIService from "../APIService.js";
import justNumbers from "../../../utils/justNumbers.js";
import search from "./search.js";

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
    const codeAgent = await getElementTextByXpath(page, '//*[@id="corpo"]/header/div/div/div/div[2]/span');
    const codeAgentText = justNumbers(codeAgent);

    if (!codeAgentText) {
      throw new Error("Código do agente não encontrado");
    }

    const isValidSRCC = await verifySRCC(page, proposal.proposal, codeAgentText);

    if (!isValidSRCC) {
      throw new Error("Proposta possui registro de SRCC");
    }

    await search(page, proposal.proposal);

    await clickElementByXpath(
      page,
      '//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]',
      5000
    );

    await sleep(1000);

    await clickElementByXpath(
      page,
      '//*[@id="modalAprovacaoEsteira"]/div/div/div[2]/div/div[3]/div/button[1]'
    );

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
      data: error.message,
    };
  }
}

