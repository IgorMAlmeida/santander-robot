import { initialize } from "../InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";

export default async function approval(proposals, credentials) {
  let { page, browser } = await initialize();

  await login(page, credentials);

  let result = [];

  for (const proposal of proposals) {
    try {
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
