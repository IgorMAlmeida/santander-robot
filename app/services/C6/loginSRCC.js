import { clickElementByXpath } from "../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export async function loginSRCC(page) {
  try {
    const url = process.env.C6_SRCC_URL;
    const username = process.env.C6_SRCC_LOGIN;
    const password = process.env.C6_SRCC_PASS_LOGIN;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const FISession = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('FISession');
    });

    await page.type('::-p-xpath(//*[@id="EUsuario_CAMPO"])', username);

    await page.type('::-p-xpath(//*[@id="ESenha_CAMPO"])', password);
    await clickElementByXpath(page,'//*[@id="lnkEntrar"]');

    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
  
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    await page.goto(`https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaCanInt.aspx?FISession=${FISession}`, { waitUntil: 'domcontentloaded' });

    return {
      status: true,
      data: FISession
    }; 
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: false,
      data: error
    };
  }
}

