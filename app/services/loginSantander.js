import puppeteer from 'puppeteer';
import { clickElementByXpath } from "../../utils.js";

export async function loginSantander(username, password) {
  
  try {
    const url = 'https://www.santandernegocios.com.br/portaldenegocios/#/externo';

    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: false,
        ignoreDefaultArgs: ['--disable-extensions'], 
        executablePath: '/usr/bin/google-chrome'
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', req => {
        if (req.resourceType() === 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto(url);

    await page.type('::-p-xpath(//*[@id="userLogin__input"])', username);
    await page.type('::-p-xpath(//*[@id="userPassword__input"])', password);
    await Promise.all([
      await page.waitForNavigation(),
      clickElementByXpath(page,'//html/body/app/ui-view/login/div/div/div/div/div[2]/div[3]/button[2]'), 
    ]);

    return { page, browser }; 
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error('Login failed');
  }
}

