import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { loginPortal } from './loginPortal.js'; 
import { UnlockUser } from './UnlockUser.js';
import path from 'path';
import fs from 'fs';
import { sleep } from '../../../../utils.js';
import { logoutBmg } from './logoutBMG.js';
import { checkInboxEmail } from './checkInboxEmail.js';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function UnlockController(params) {
  console.log(`Desbloqueando usuário para o banco Master com parâmetros:`, params);
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
    ],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()  
  });

  const page = await browser.newPage();
  try {
    console.log('Iniciando Login...');

    const loginData = await loginPortal(page);
    if (!loginData.status) {
      if (loginData.isPortalError) {
        await browser.close();
      }
      throw new Error(loginData.data);
    }

    console.log(params)
    console.log('Login concluido com sucesso. Iniciando desbloqueio...');
    const unlock = await UnlockUser(loginData.data, params);
    if(!unlock.status) {
      throw new Error(unlock.data);
    }
    
    const checkEmailPass = await checkInboxEmail(loginData.data, params);
    // const checkEmailPass = await checkInboxEmail(page, params);
    if(!checkEmailPass.status) {
      throw new Error(checkEmailPass.data);
    }

    await sleep(15000);
    await sleep(1000)

    return {
      status: true,
      response: unlock.message,
      data: unlock.data
    };
  } catch (err) {
    // await browser.close();
    // await logoutBmg(page);

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
