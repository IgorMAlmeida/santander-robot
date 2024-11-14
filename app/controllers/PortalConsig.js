import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

import { loginPortalConsig } from '../services/PortalConsignado/loginPortalConsig.js';
import { consultService } from '../services/PortalConsignado/consultService.js';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function PortalConsig(consultParams) {
  const browser = await puppeteer.launch({
    userDataDir: "./user_data",
    ignoreDefaultArgs: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu','--disable-software-rasterizer','--disable-dev-shm-usage'],
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()  
  });

  const page = await browser.newPage();
  try {
    console.log('Iniciando Login...');

    const loginData = await loginPortalConsig(page);
    if (!loginData.status) {
      throw new Error(loginData.data);
    }
    console.log('Login concluido com sucesso. Iniciando consulta...');

    const consultData = await consultService(loginData.data, consultParams);
    if (!consultData.status) {
      throw new Error(consultData.data);
    }
    console.log('Consulta concluido com sucesso.');

    await browser.close();
    return {
      status: true,
      response: "Dados consultados com sucesso",
      data: consultData.data
    };
  } catch (err) {
    await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
