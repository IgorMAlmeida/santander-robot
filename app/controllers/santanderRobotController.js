import express from 'express';
import { loginSantander } from '../services/loginSantander.js';
import { getOperationScreen } from '../services/getOperationScreen.js';
import puppeteer from 'puppeteer';
import { sleep } from '../../utils.js';

const app = express();

const retryTimes = 5;
let retriedTimes = 0;

export async function santanderRobot(req, res) {
  try {
    const codProposalProposal = req.body.propostaId;      
    const username = 'EX114688';
    const password = 'CF@5410';

    const { page, browser } = await loginSantander(username, password);
    const data = await getOperationScreen(page, 'andamento', codProposalProposal);

    if (!data.status) {
      if(retriedTimes < retryTimes) {
        // await browser.close();
        retriedTimes++;
        // await santanderRobot(req, res);
        return;
      }
      await browser.close();
      throw new Error(data.message);
    }

    const responseObj = {
        erro: false,
        dados: data.data
    };

    await browser.close();
    return (responseObj);

  } catch (err) {
    return ({ err: true, mensagem: 'Internal Server Error' });
  }
}



export async function santanderRobotProposal(req, res) {
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
    await sleep(2000);

    const result = await newPage.evaluate(() => {
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

      cpfInput.value = '141.476.226-74';
      passwordInput.value = 'Cfp@2020';

      return { success: true, message: 'Campos preenchidos com sucesso.' };

    });

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

    await page.goto('https://www.parceirosantander.com.br/spa-base/logged-area/support', { waitUntil: 'networkidle0' });
    await sleep(2000); // Aumentei o tempo de espera para garantir que a página carregue

    const data = await page.evaluate(() => {
      const items = document.querySelectorAll('dss-list-item');
  
      const extractedData = Array.from(items).map(item => {
        const cliente = item.querySelector('dss-list-item-title:nth-child(1) .dss-body')?.textContent.trim();
        const regra = item.querySelector('dss-list-item-title:nth-child(2) .dss-body')?.textContent.trim();
        const digitacao = item.querySelector('dss-list-item-title:nth-child(3) .dss-body')?.textContent.trim();
        const proposta = item.querySelector('dss-list-item-title:nth-child(4) .dss-body')?.textContent.trim();
        const status = item.querySelector('dss-list-item-title:nth-child(5) .dss-body')?.textContent.trim();
  
        return {
          cliente,
          regra,
          digitacao,
          proposta,
          status
        };
      });
  
      return extractedData;
    });

    console.log(data);

    // Tentar interagir com a seção de informações do usuário
    await page.waitForSelector('.container-userinfo', { timeout: 5000 }); // Aumentei o timeout para garantir a detecção
    await page.click('.container-userinfo');
    await sleep(2000);  // Aumentei o tempo de espera

    await page.waitForSelector('.dss-button--icon-button', { timeout: 5000 }); // Timeout aumentado
    await page.click('.dss-button--icon-button');
    await sleep(2000);

    await browser.close();
    return data;

  } catch (error) {
    console.error('Erro durante a execução do script:', error);
    return { error: 'Erro ao executar o robô.' };
  }
}



