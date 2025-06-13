import { clickElementByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import logger from "../../../utils/logger.js";

export default async function verifySRCC(page, proposal, codeAgent) {
  logger.debug("Starting SRCC verification", { proposalId: proposal, codeAgent });
  
  logger.debug("Navigating to proposal analysis page");
  await page.goto(
    `https://desenv.facta.com.br/sistemaNovo/propostaAnalise.php?codigo=${proposal}&corretor=${codeAgent}`
  );

  await sleep(2000);

  logger.debug("Clicando no botão de histórico de SRCC");
  await clickElementByXpath(page, '//*[@id="btnCarregaHistoricoSRCC"]');

  await sleep(1000);

  logger.debug("Lendo o conteúdo do histórico de SRCC");
  const divText = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]');

  if (divText === "Não foram encontrados resultados para sua pesquisa.") {
    logger.debug("Nenhum resultado encontrado para a pesquisa de SRCC");
    return true;
  }

  logger.debug("Verificando o valor do flag de SRCC");
  const srccTd = await getElementTextByXpath(page, '//*[@id="divHistoricoSRCC"]/table/tbody/tr/td[3]');
  logger.debug("Valor do flag de SRCC", { srccValue: srccTd });

  if (!srccTd || srccTd === 'N') {
    logger.debug("Flag de SRCC é negativa ou vazia, prosseguindo");
    return true;
  }

  logger.warn("Flag de SRCC é positiva, não é possível prosseguir");
  throw new Error("Proposta possui registro de SRCC");
}