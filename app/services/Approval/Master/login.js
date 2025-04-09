import { clickElementByXpath, sleep } from "../../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page, credentials) {
  try {
    const url = process.env.OLE_APROVACAO_URL;
    const username = credentials.username;
    const password = credentials.password;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.type('::-p-xpath(//*[@id="mat-input-0"])', username);

    await page.type('::-p-xpath(//*[@id="mat-input-1"])', password);
    await clickElementByXpath(
      page,
      "/html/body/app-root/app-login/div/div[2]/mat-card/mat-card-content/form/div[3]/button[2]"
    ); 

    await sleep(1000);
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    return { status: true }; 
  } catch (error) {
    console.error('Error during login:', error);
    return { status: false };
  }
}

