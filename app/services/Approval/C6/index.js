import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";

/**
 * processData
 * @description Processa as propostas de aprovação da C6
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
  let FISession = null;

  let result = [];

  for (const proposal of proposals) {
    try {
      if (!FISession) {
        const loginData = await login(page, credentials);

        if (!loginData.status) {
          throw new Error(loginData.data);
        }

        FISession = loginData.data;
      }

      await page.goto(
        `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`,
        {
          waitUntil: "networkidle0",
          timeout: 30000,
        }
      );

      const currentUrl = page.url();
      if (currentUrl.includes("login") || currentUrl.includes("Login")) {
        console.log("Sessão expirou, logando novamente");
        FISession = null;

        const loginData = await login(page, credentials);
        if (!loginData.status) {
          throw new Error(loginData.data);
        }

        FISession = loginData.data;

        await page.goto(
          `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`,
          {
            waitUntil: "networkidle0",
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
      FISession = null;
    }

    console.log(`Processou a proposta ${proposal.proposal}`);
  }

  await browser.close();

  return result;
}
