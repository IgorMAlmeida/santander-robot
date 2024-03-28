import puppeteer from 'puppeteer';
import { clickElementByXpath } from "../../utils.js";

export async function loginSantander(username, password) {
  
  try {
    const url = 'https://www.santandernegocios.com.br/portaldenegocios/#/externo';

    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        //tester com headless true
        headless: false,
        ignoreDefaultArgs: ['--disable-extensions'], 
        executablePath: '/usr/bin/google-chrome'

    });

    const pages = await browser.pages();
    let page;

    if (pages.length > 0) {
        page = pages[0];
    } else {
        page = await browser.newPage();
    }

    await page.setRequestInterception(true);
    page.on('request', req => {
        if (req.resourceType() === 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    //testar removendo este trecho
    page = await browser.newPage();
    await page.goto(url);

    await page.type('::-p-xpath(//*[@id="userLogin__input"])', username);
    await page.type('::-p-xpath(//*[@id="userPassword__input"])', password);
    await Promise.all([
      page.waitForNavigation(),
      clickElementByXpath(page,'//html/body/app/ui-view/login/div/div/div/div/div[2]/div[3]/button[2]'), 
    ]);

    return page; 
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error('Login failed');
  }
}

