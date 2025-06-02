import { clickElementByXpath, sleep } from "../../../../utils.js";
import logger from "../../../utils/logger.js";

export default async function search(page, proposal) {
  logger.debug("Navigating to Facta proposal progress page", { proposalId: proposal });
  
  await page.goto(
    `https://desenv.facta.com.br/sistemaNovo/andamentoPropostas.php`,
    { waitUntil: "domcontentloaded" }
  );

  logger.debug("Entering proposal ID in search field", { proposalId: proposal });
  await page.type('::-p-xpath(//*[@id="codigoAf"])', proposal);
  
  logger.debug("Selecting 'awaiting approval' filter");
  await clickElementByXpath(page, '//*[@id="aguardandoAprovacaoEsteira"]');
  
  logger.debug("Clicking search button");
  await clickElementByXpath(page, '//*[@id="pesquisar"]');

  await sleep(500);
  logger.debug("Search completed", { proposalId: proposal });
}
