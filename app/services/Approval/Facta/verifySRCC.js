import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";

export default async function verifySRCC(page, proposal, codeAgent) {
  try {
    await page.goto(
      `https://desenv.facta.com.br/sistemaNovo/propostaAnalise.php?codigo=${proposal}&corretor=${codeAgent}`
    );

    await clickElementByXpath(page, '//*[@id="btnCarregaHistoricoSRCC"]');

    await sleep(1000);

    const divText = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]');

    if (divText === "Não foram encontrados resultados para sua pesquisa.") {
      return true;
    }

    const srccTd = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]/table/tbody/tr/td[3]');

    if (!srccTd || srccTd === 'N') {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err)
    return false
  }
}