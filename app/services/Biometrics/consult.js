import {
  getElementTextByXpath,
  typeByXpath,
  sleep,
} from "../../../utils.js";

export async function consult(page, cpf) {
  try {
    await page.goto(
      "https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral#/atendimento-eleitor/consultar-situacao-titulo-eleitor"
    );

    await sleep(5000);
    await typeByXpath(page, '//*[@id="titulo-cpf-nome"]', cpf, 10000);
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Tab');
    }
    await sleep(3000);
    await page.keyboard.press('Enter');

    const regular = await getElementTextByXpath(
      page,
      '//*[@id="content"]/app-root/div[1]/app-consultar-situacao-titulo-eleitor/div[1]/div[1]/p',
      10000
    );

    const biometricsInfo = await getBiometricsBoxText(page);

    return {
      status: true,
      data: {
        regular,
        biometricsInfo,
      },
    };
  } catch (error) {
    return { 
      status: false,
      data: error.message,
    };
  }
}

async function getBiometricsBoxText(page) {
  const boxSelector = '//*[contains(@class, "box-comunicado")]';
  
  try {
    await page.waitForSelector(`::-p-xpath(${boxSelector})`, { timeout: 5000 });
    
    const boxText = await page.evaluate((selector) => {
      const element = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!element) return null;
      return element.innerText;
    }, boxSelector);
    
    return boxText || "Não foi possível encontrar informações de biometria";
  } catch (error) {
    throw new Error(`Erro ao buscar informações de biometria: ${error.message}`);
  }
}

