import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

import { loginSRCC } from '../services/SRCC/loginSRCC.js';
import { consultSRCC } from '../services/SRCC/consultSRCC.js';

import dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));


export async function SRCCConsult(cpf) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()
  });

  const page = await browser.newPage();

  try {
    const url = process.env.OLE_URL_BASE;
    const username = process.env.SRCC_LOGIN;
    const password = process.env.SRCC_PASS_LOGIN;
    
    await loginSRCC(page, url, username, password);

    const data = await consultSRCC(page, cpf);

    if (!data.status) {
      throw new Error(data.data);
    }

    await browser.close();

    return {
      status: true,
      response: "Registro encontrado com sucesso",
      data: null
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
