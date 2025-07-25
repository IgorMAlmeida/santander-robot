import dotenv from "dotenv";
import { clickElementByXpath, checkElementAndText, sleep } from "../../../utils.js";
import logger from "../../utils/logger.js";
import { PAN_LOGIN_CONFIG } from "./config.js";
import { Sendmail } from "../Common/Email/SendMail.js";
import { CheckEmailBiometrics } from "../Common/Email/CheckEmailBiometrics.js";
dotenv.config();

export default async function login(page) {
  try {
    console.log("Iniciando autenticação do usuário");
    const url = process.env.PAN_URL;
    const user_store = process.env.PAN_USER_AND_STORE;
    const pass = process.env.PAN_PASS;

    const MAX_TIMEOUT = 60 * 60 * 1000;
    let startTime = Date.now();
    let elapsedPaused = 0;

    outer: while (true) {
      if (Date.now() - startTime - elapsedPaused >= MAX_TIMEOUT) {
        throw new Error('Não foi possível autenticar: tempo excedido');
      }
  
      await page.goto(url, { waitUntil: 'networkidle2' });
      await sleep(1000);
      logger.debug("Acessando URL:", url);
      await page.type(`::-p-xpath(${PAN_LOGIN_CONFIG.SELECTORS.USER_AND_STORE_FIELD})`, user_store);
  
      await clickElementByXpath(page, PAN_LOGIN_CONFIG.SELECTORS.USER_AND_STORE_BUTTON_FIELD);
      logger.debug(`Botão de login clicado ${page.url()}`);
      await sleep(2000);
  
      logger.debug("Verificando se a página requer biometria");
  
      const checkBiometrics = await checkElementAndText(page, PAN_LOGIN_CONFIG.SELECTORS.URL_BIOMETRICS_FIELD);
      await sleep(1000);
      if (checkBiometrics.status && checkBiometrics.text.includes('https://p.pan.b.br/')) {
        logger.debug("URL encontrada na pagina. Verificando se é biometria.");
        await clickElementByXpath(page, PAN_LOGIN_CONFIG.SELECTORS.BIOMETRICS_SEND_FIELD);
        await sleep(1500);
        const checkIfHasBiometrics = await checkElementAndText(page, PAN_LOGIN_CONFIG.SELECTORS.BIOMETRICS_ERROR_FIELD);
        logger.debug(`Verificando se é biometria. ${checkIfHasBiometrics}`);
        
        if (checkIfHasBiometrics.status && checkIfHasBiometrics.text.includes('Biometria pendente de validação.')) {
          logger.debug("Biometria pendente de validação");
          const sender = process.env.EMAIL_SUPORTE_LOGIN;
          const senderPass = process.env.PASS_SUPORTE_LOGIN;
          const recipient = process.env.BIOMETRICS_EMAIL_RECIPIENT;
          const subject = process.env.BIOMETRICS_EMAIL_SUBJECT + " - PAN";
          const message = `Use o link abaixo para acessar a página de biometria: ${checkBiometrics.text}`;
          const emailInfo = await Sendmail(sender, senderPass, recipient, subject, message);
          logger.debug(`Email enviado para validação de biometria`);
          console.log({ emailInfo });
          const checkMailStart = Date.now();
          logger.debug(`Checando mail de biometria...`);
          const biomValidated = await checkMail();
          const checkMailTime = Date.now() - checkMailStart;
          elapsedPaused += checkMailTime;
          if (biomValidated) {
            await sleep(1500);
            await clickElementByXpath(page, PAN_LOGIN_CONFIG.SELECTORS.BIOMETRICS_SEND_FIELD);
            logger.debug("Biometria validada. Saindo do loop.");
            break outer;
          }
          await sleep(2000);
        }
      }else{
        break outer;
      }
    }

    await sleep(1000);
    await page.type(`::-p-xpath(${PAN_LOGIN_CONFIG.SELECTORS.USER_PASS_FIELD})`, pass);
    await clickElementByXpath(page, PAN_LOGIN_CONFIG.SELECTORS.USER_AND_STORE_BUTTON_FIELD);
    logger.debug("Login realizado com sucesso");

    await sleep(1000);
    return {
      status: true,
      data: "Login realizado com sucesso",
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}

async function checkMail(timeout = 10 * 60 * 1000, pollingInterval = 30 * 1000) {
  const email = process.env.EMAIL_SUPORTE_LOGIN;
  const emailPassword = process.env.PASS_SUPORTE_LOGIN;
  const emailHost = process.env.IMAP_HOST;
  const emailPort = parseInt(process.env.IMAP_PORT);
  const emailSubject = process.env.BIOMETRICS_RESPONSE_EMAIL_SUBJECT;
  const emailSender = process.env.BIOMETRICS_EMAIL_RECIPIENT;
  const emailText = 'FEITO';

  try {
    const startTime = Date.now();
    logger.debug(`Inicio da checagem de email: ${(startTime / 60000).toFixed(2)} minutos`);

    while (Date.now() - startTime < timeout) {
      logger.debug(`Loop de checagem de email: ${(Date.now() / 60000).toFixed(2)} minutos`);

      const found = await CheckEmailBiometrics({
        email,
        emailPassword,
        emailHost,
        emailPort,
        emailSubject,
        emailSender,
        emailText,
      });

      if (found) {
        console.log('E-mail de biometria identificado!');
        return true;
      }
      await sleep(pollingInterval)
    }

    console.log('Tempo limite de espera atingido. E-mail não encontrado.');
    return false;
  } catch (err) {
    console.error('Erro ao verificar e-mails:', err);
    throw err;
  }
}