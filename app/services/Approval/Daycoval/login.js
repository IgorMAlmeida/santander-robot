import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
import { solveCaptcha } from "./solveCaptcha.js";
dotenv.config();

export async function login(page, credentials) {
  try {
    const url = process.env.DAYCOVAL_APROVACAO_URL;
    
    const username = credentials.username;
    const password = credentials.password;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const captchaText = await solveCaptcha(page);
    await page.type(
      '::-p-xpath(//*[@id="Captcha_txtCaptcha_CAMPO"])',
      captchaText
    );

    await page.type('::-p-xpath(//*[@id="EUsuario_CAMPO"])', username);
    await page.type('::-p-xpath(//*[@id="ESenha_CAMPO"])', password);

    await clickElementByXpath(page,'//*[@id="lnkEntrar"]');

    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
  
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    await page.goto(
      `https://consignado.daycoval.com.br/Autorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx`,
      { waitUntil: "domcontentloaded" }
    );

    return {
      status: true,
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: false,
      data: error
    };
  }
}

