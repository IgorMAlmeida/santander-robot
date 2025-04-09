import { clickElementByXpath, sleep } from "../../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page, credentials) {
  try {
    const url = process.env.OLE_APROVACAO_URL;
    const username = credentials.username;
    const password = credentials.password;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.type('::-p-xpath(//*[@id="Login"])', username);

    await page.type('::-p-xpath(//*[@id="Senha"])', password);
    await clickElementByXpath(page, '//*[@id="botaoAcessar"]'); 

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    return { status: true }; 
  } catch (error) {
    console.error('Error during login:', error);
    return { status: false };
  }
}

