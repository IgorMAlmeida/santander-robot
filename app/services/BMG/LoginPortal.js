import { solveImageCaptcha } from '../Anticaptcha/Anticaptcha.js'
import { checkElementAndText, clickElementByXpath, sleep } from '../../../utils.js';
import path from 'path';
import fs from 'fs';
import { PortalError } from '../../errors/PortalError.js';

async function handleLoginWithAlert(page) {
  let alertDetected = false;
  let alertMessage = '';
  let dialogHandled = false;

  const dialogHandler = async (dialog) => {
    if (dialogHandled) {
      console.log('Dialog já processado, ignorando duplicata');
      return;
    }

    alertDetected = true;
    alertMessage = dialog.message();
    dialogHandled = true;

    console.log('Alert detectado:', alertMessage);

    if (alertMessage.includes('A sua senha está próxima de expirar')) {
      console.log('Alert de senha próxima de expirar - aceitando...');
    }

    try {
      await dialog.accept();
      console.log('Dialog aceito com sucesso');
    } catch (error) {
      console.log('Erro ao aceitar dialog:', error.message);
    }
  };

  page.on('dialog', dialogHandler);

  try {
    await clickElementByXpath(page, '//*[@id="bt-login"]');

    await sleep(2000);

    if (alertDetected) {
      console.log('Alert processado com sucesso');
    } else {
      console.log('Nenhum alert detectado');
    }

  } finally {
    page.off('dialog', dialogHandler);
  }

  return { alertDetected, alertMessage };
}

export async function loginPortal(page) {
  try {
    const url = process.env.BMGCONSIG_DESBLOQUEIO;
    const username = process.env.BMGCONSIG_USER;
    const password = process.env.BMGCONSIG_PASS;

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.type('::-p-xpath(//*[@id="usuario"])', username);
    await page.type('::-p-xpath(//*[@id="j_password"])', password);
    await sleep(500);

    await page.waitForSelector('iframe[name="iCaptcha"]', { timeout: 10000 });
    const iframeElement = await page.$('iframe[name="iCaptcha"]');
    const iframe = await iframeElement.contentFrame();
    if (!iframe) throw new Error('Não foi possível acessar o conteúdo do iframe');

    const captchaElement = await iframe.$('img');
    if (!captchaElement) throw new Error('Imagem do CAPTCHA não encontrada dentro do iframe');

    const projectRoot = process.cwd();
    const dirPath = path.join(projectRoot, 'uploads/captchaImages');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const formattedDate = new Date().toISOString().replace(/[:.]/g, '_');
    const filePath = path.join(dirPath, `captcha_image_${formattedDate}.png`);

    await captchaElement.screenshot({ path: filePath });

    const text = await solveImageCaptcha(filePath);
    await page.type('#captcha', text);
    console.log('Captcha solved:', text);

    await sleep(1000);
    const { alertDetected, alertMessage } = await handleLoginWithAlert(page);
    // await clickElementByXpath(page, '//*[@id="bt-login"]');
    fs.unlinkSync(filePath);

    await sleep(1000);
    const checkErrorLogin = await checkElementAndText(page, '//*[@id="msg-error"]');
    if (checkErrorLogin.status) {
      if (checkErrorLogin.text.includes('Foi detectada uma possível tentativa de acesso simultâneo')) {
        const dateTime = new Date().toLocaleString('pt-BR');
        throw new PortalError(`${checkErrorLogin.text} - Detectado em: ${dateTime}`, true);
      }

      if (checkErrorLogin.text.includes('A palavra de verificação está inválida.')) {
        throw new PortalError("Captcha Invalido.", true);
      }

      if (checkErrorLogin.text.includes('se encontra bloqueado. Entre em contato com Master.')) {
        throw new PortalError(checkErrorLogin.text, true);
      }

      throw new Error("Erro não identificado. No login.");
    }

    return {
      status: true,
      data: page,
      message: alertMessage || 'Login realizado com sucesso',
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: false,
      data: error,
      isPortalError: error instanceof PortalError
    };
  }
}

