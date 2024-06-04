import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

import { loginSRCC } from '../services/C6/loginSRCC.js';
import { consultSRCC } from '../services/C6/consultSRCC.js';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function C6Consult(proposal) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()
  });

  const page = await browser.newPage();

  try {
    console.log('Iniciando Login...');
    const loginData = await loginSRCC(page);

    if (!loginData.status) {
      throw new Error(loginData.data);
    }

    const data = await consultSRCC(page, proposal);

    if (!data.status) {
      throw new Error(data.data);
    }

    await browser.close();

    return {
      status: true,
      response: "Registro encontrado com sucesso",
      data: data.data
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
