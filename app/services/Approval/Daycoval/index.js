import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";

/**
 * approval
 * @description Processa as propostas de aprovação da Daycoval
 * @param {{
 *  proposal: string,
 *  postBack: {
 *    url: string,
 *    headers: Object,
 *  }
 * }} proposals - Propostas de aprovação
 * @param {{
 *  username: string,
 *  password: string,
 * }} credentials - Credenciais de login
 * @returns {Promise<Object>} Resultado da aprovação
 */

export async function approval(proposals, credentials) {
  let { page, browser } = await initialize();

  await login(page, credentials);

  let result = [];

  for (const proposal of proposals) {
    try {
      await page.goto(
        `https://consignado.daycoval.com.br/Autorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx`,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        }
      );

      const currentUrl = page.url();
      if (currentUrl.includes("login") || currentUrl.includes("Login")) {
        console.log("Sessão expirou, logando novamente");

        await login(page, credentials);

        await page.goto(
          `https://consignado.daycoval.com.br/Autorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx`,
          {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          }
        );
      }

      const consultResult = await consult(page, proposal);

      result.push({
        proposal: proposal.proposal,
        approved: consultResult.data,
      });
    } catch (error) {
      result.push({
        proposal: proposal.proposal,
        error: error.message,
      });

      await browser.close();
      let recreate = await initialize();
      page = recreate.page;
      browser = recreate.browser;
    }

    console.log(`Processou a proposta ${proposal.proposal}`);
  }

  await browser.close();

  return result;
}
