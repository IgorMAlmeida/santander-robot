import puppeteer from 'puppeteer';

import { loginSRCC } from '../services/C6/loginSRCC.js';
import { consultSRCC } from '../services/C6/consultSRCC.js';

export async function C6Consult(proposal) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
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

  try {
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
