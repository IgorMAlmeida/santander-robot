import { clickElementByXpath, checkElementAndText } from "../../../utils.js";

let retryTimes = 0;

export async function loginSRCC(page, url, username, password) {
  try {
    await page.goto("https://ola.oleconsignado.com.br/ConsultaSrcc", { waitUntil: 'domcontentloaded' });
    const inputCpf = await checkElementAndText(page, '//*[@id="Cpf"]')

    if(inputCpf.status) {
      return true
    }
    
    console.log('Iniciando Login...');
    await page.goto(url);
    const error5001 = await checkElementAndText(page, '/html/body/div/div/div/h1');
    if(error5001.status) {
      throw new Error('Error 500 OLE SITE');
    }

    await page.type('::-p-xpath(//*[@id="Login"])', username);
    await page.type('::-p-xpath(//*[@id="Senha"])', password);
    clickElementByXpath(page,'//*[@id="botaoAcessar"]');
   
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    console.log('Logado');

    await page.goto("https://ola.oleconsignado.com.br/ConsultaSrcc", { waitUntil: 'domcontentloaded' });
    console.log('Iniciando consulta');
    
    const error500 = await checkElementAndText(page, '/html/body/div/div/div/h1');
    if(error500.status) {
      throw new Error('Error 500 OLE SITE');
    }
    return true; 
  } catch (error) {
    console.error('Error during login:', error);

    if (retryTimes < 5) {
      retryTimes++;
      return await loginOle(page, username, password, url);
    }

    return false;
  }
}

