import { clickElementByXpath, sleep } from "../../../../utils.js";
import logger from "../../../utils/logger.js";

export default async function search(page, proposal) {
  logger.debug("Navigating to Facta proposal progress page", { proposalId: proposal });
  
  await page.goto(
    `https://desenv.facta.com.br/sistemaNovo/andamentoPropostas.php`,
    { waitUntil: "domcontentloaded" }
  );

  logger.debug("Digitando o ID da proposta na busca");
  await page.type('::-p-xpath(//*[@id="codigoAf"])', proposal);
  
  logger.debug("Selecionando o filtro 'aguardando aprovação'");
  await clickElementByXpath(page, '//*[@id="aguardandoAprovacaoEsteira"]');
  
  logger.debug("Clicando no botão de busca");
  await clickElementByXpath(page, '//*[@id="pesquisar"]');

  await sleep(500);
  logger.debug("Pesquisa de proposta concluída");
}
