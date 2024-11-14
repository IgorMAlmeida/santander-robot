import { awaitElement, checkElementAndText, clickElementByXpath, getElementClass, getElementTextByXpath, sleep } from "../../../utils.js";
import { solveImageCaptcha } from  '../Anticaptcha/Anticaptcha.js'
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export async function loginPortalConsig(page) {
  try {
    const url      = process.env.PORTAL_CONSIGNADO_URL;
    const username = process.env.PORTAL_CONSIGNADO_USER;
    const password = process.env.PORTAL_CONSIGNADO_PASS;
    
    await page.goto(url, { waitUntil: 'networkidle0' });
    await clickElementByXpath(page,'//*[@id="guias"]/div[2]/span/span');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.evaluate((username) => {
      document.querySelector('input#username').value = username;
    }, username);
    await page.type('::-p-xpath(//*[@id="password"])', password);

    const captchaImageElement = await page.$('#cipCaptchaImg');
    const projectRoot = process.cwd();
    const dirPath = path.join(projectRoot, 'uploads/captchaImages');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const formattedDate = new Date().toISOString().replace(/[:.]/g, '_');
    const filePath = path.join(dirPath, `captcha_image_${formattedDate}.png`);
    await captchaImageElement.screenshot({ path: filePath });

    const text = await solveImageCaptcha(filePath);
    fs.unlinkSync(filePath);
    await page.type('::-p-xpath(//*[@id="captcha"])', text);
    await clickElementByXpath(page,'//*[@id="idc"]');
    
    const errorSelector = await awaitElement(page, '//*[@id="divEtapaError2"]/span[1]');
    if(errorSelector.status){
      const errorSelectors = [
        '/html/body/div[1]/div[2]/form/div[3]/div/div/div/div[1]/div/div/ul/li/span',
        '/html/body/div[1]/div[2]/form/div[3]/div/div/div/div[1]/div/div/ul/li[1]/span',
        '/html/body/div[1]/div[2]/form/div[3]/div/div/div/div[1]/div/div/ul/li/span'
      ];

      for (const selector of errorSelectors) {
        const errorMessage = await getElementTextByXpath(page, selector);
        if (errorMessage) {
          throw new Error(errorMessage);
        }
      }
    }
    
    return {
      status: true,
      data: page
    }; 
  } catch (error) {
    
    console.error('Error during login:', error);
    return {
      status: false,
      data: error
    };
  }
}

