import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { loginPortal } from './LoginPortal.js'; 
import { UnlockUser } from './UnlockUser.js';
import { blockUnnecessaryRequests, sleep } from '../../../../utils.js';
import { logoutBmg } from './LogoutBMG.js';
import { checkInboxEmail } from './CheckInboxEmail.js';

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
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()  
  });

  const page = await browser.newPage();
  await blockUnnecessaryRequests(page);

  try {
    await sleep(1000);
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
    await logoutBmg(unlock.data);
    
    console.log('Desbloqueio concluido com sucesso. Iniciando checagem de email...');
    const checkEmailPass = await checkInboxEmail(loginData.data, params);
    if(!checkEmailPass.status) {
      throw new Error(checkEmailPass.data);
    }
    await sleep(1000);
    await browser.close();

    return {
      status: true,
      response: checkEmailPass.message,
      data: 'Usuário desbloqueado e senha resetada com sucesso.',
    };
  } catch (err) {
    await sleep(1000);
    await logoutBmg(page);
    await sleep(1000);
    await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
