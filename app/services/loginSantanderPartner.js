import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { sleep } from '../../utils.js';
dotenv.config();

export async function loginSantanderPartner() {
  try {
    const url = process.env.SANTANDER_PARTNER_URL;
    const username = process.env.SANTANDER_PARTNER_LOGIN;
    const password = process.env.SANTANDER_PARTNER_PASS_LOGIN;
    
    const browser = await puppeteer.launch({
      headless: false, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-gpu',
        '--disable-extensions',
        '--window-size=1920,1080',
        '--start-maximized',
        '--remote-debugging-port=9222',
        '--hide-scrollbars',
        '--mute-audio',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
    
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
    
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#action__access-portal');
    await page.click('#action__access-portal');
    await sleep(2000);

    const pages = await browser.pages();
    const newPage = pages[pages.length - 1];
    await newPage.bringToFront();
    await sleep(1000);
    
    await newPage.waitForSelector('#form');
    const result = await newPage.evaluate((username, password) => {
      const loginForm = document.getElementById('form');
      if (!loginForm) {
        return { error: 'Elemento <form> não encontrado.' };
      }

      const shadowRoot = loginForm.shadowRoot || loginForm.sr;
      if (!shadowRoot) {
        return { success: false, error: 'ShadowRoot não encontrado.' };
      }

      const cpfInput = shadowRoot.querySelector('#inputUser');
      const passwordInput = shadowRoot.querySelector('#inputPassword');
      if (!cpfInput || !passwordInput) {
        return { success: false, error: 'Campos CPF ou Senha não encontrados.' };
      }

      cpfInput.value = username;
      passwordInput.value = password;

      return { success: true, message: 'Campos preenchidos com sucesso.' };
    }, username, password);

    if (!result.success) {
      throw new Error(result.error);
    }

    await newPage.evaluate(() => {
      const loginButton = document.querySelector('#kc-form-login-btn');
      if (loginButton && loginButton.hasAttribute('disabled')) {
        loginButton.removeAttribute('disabled');
      }
    });

    await newPage.waitForSelector('#kc-form-login-btn');
    await newPage.click('#kc-form-login-btn');

    await sleep(1500);
    return { page, browser }; 
  } catch (error) {
    console.error('Erro durante o login:', error);
    throw new Error('Falha no login');
  }
}
