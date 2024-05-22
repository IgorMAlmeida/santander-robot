import { clickElementByXpath, checkElementAndText, blockUnnecessaryRequests } from "../../utils.js";

export async function loginOle(page, username, password, url) {
  
  try {
    await blockUnnecessaryRequests(page);

    await page.goto(url);
    const error5001 = await checkElementAndText(page, '/html/body/div/div/div/h1');
    if(error5001.status) {
        throw new Error('Error 500 OLE SITE');
    }

    await page.type('::-p-xpath(//*[@id="Login"])', username);
    await page.type('::-p-xpath(//*[@id="Senha"])', password);
    clickElementByXpath(page,'//*[@id="botaoAcessar"]');
   
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

    await page.goto("https://ola.oleconsignado.com.br/ConsultaDeProposta/Index", { waitUntil: 'domcontentloaded' });
    
    const error5002 = await checkElementAndText(page, '/html/body/div/div/div/h1');
    if(error5002.status) {
      throw new Error('Error 500 OLE SITE');
    }

    return true; 
  } catch (error) {
    console.error('Error during login:', error);
    return false;
  }
}

