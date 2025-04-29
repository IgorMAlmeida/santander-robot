import { clickElementByXpath, sleep } from "../../../../utils.js";

export default async function search(page, proposal) {
  await page.goto(
    `https://desenv.facta.com.br/sistemaNovo/andamentoPropostas.php`,
    { waitUntil: "domcontentloaded" }
  );

  await page.type('::-p-xpath(//*[@id="codigoAf"])', proposal);
  await clickElementByXpath(page, '//*[@id="aguardandoAprovacaoEsteira"]');
  await clickElementByXpath(page, '//*[@id="pesquisar"]');

  await sleep(500);
}
