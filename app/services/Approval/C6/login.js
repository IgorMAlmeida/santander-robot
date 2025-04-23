import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page, credentials) {
  try {
    const url = process.env.C6_APROVACAO_URL;

    const username = credentials.username;
    const password = credentials.password;
    
    await page.goto(url, { waitUntil: "networkidle0" });

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
  
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    await page.goto(`https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`, { waitUntil: "networkidle0" });

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

