import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page) {
  try {
    const url = process.env.FACTA_SRCC_URL;
    
    const username = process.env.FACTA_SRCC_LOGIN;
    const password = process.env.FACTA_SRCC_PASS_LOGIN;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.type('::-p-xpath(//*[@id="login"])', username);

    await page.type('::-p-xpath(//*[@id="senha"])', password);
    await clickElementByXpath(page, '//*[@id="btnLogin"]');

    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
  
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    return { status: true, data: "Login realizado com sucesso" }; 
  } catch (error) {
    console.error('Error during login:', error);
    return { status: false, data: error };
  }
}

