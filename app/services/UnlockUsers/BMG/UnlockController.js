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
    const unlock = UnlockUser(loginData.data, params);
    await sleep(1000)
    if(!unlock.status) {
      throw new Error("Erro ao desbloquear usuário. Verifique os parâmetros de consulta.");
    }
    // await browser.close();
    return {
      status: true,
      response: "Usuario desbloqueado com sucesso",
      data: consultData.data
    };
  } catch (err) {
    // await browser.close();
    // await logoutBmg(page);
    await logoutBmg(page);

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
