import puppeteer from 'puppeteer';
import { sleep } from "../../utils.js";

export async function loginSantanderPartner(username, password) {
  
  try {
    const url = 'https://www.parceirosantander.com.br/spa-base/landing-page';
    
    const browser = await puppeteer.launch({ 
      headless: false, 
      args: [
        '--disable-blink-features=AutomationControlled', 
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-infobars',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--remote-debugging-port=9222',
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#action__access-portal');
    await page.click('#action__access-portal');
    await sleep(2000);

    const pages = await browser.pages();
    const newPage = pages[pages.length - 1];
    await newPage.bringToFront();
    await sleep(1000);

    const result = await newPage.evaluate((username, password) => {
      const loginForm = document.getElementById('form');
      if (!loginForm) {
        return { error: 'Elemento <login-form> não encontrado.' };
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
    

    await newPage.evaluate(() => {
      const loginButton = document.querySelector('#kc-form-login-btn');
      if (loginButton && loginButton.hasAttribute('disabled')) {
        loginButton.removeAttribute('disabled');
      }
    });

    await sleep(1000);

    await newPage.waitForSelector('#kc-form-login-btn'); 
    await newPage.click('#kc-form-login-btn');
    await sleep(2000);

    return { page, browser }; 
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error('Login failed');
  }
}

