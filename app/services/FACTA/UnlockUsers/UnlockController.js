import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { CheckInbox } from '../../Common/Email/CheckInbox.js';
import { blockUnnecessaryRequests, sleep } from '../../../../utils.js';
import { login } from '../../SRCC/Facta/login.js';
import dotenv from 'dotenv';

dotenv.config();

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function UnlockControllerFacta(params) {
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
  await blockUnnecessaryRequests(page);
  let logoutData = {status:false, data:""};
  let loginControl = false;

  try {
    await sleep(1000);
    console.log('Iniciando Login...');
    const loginData = await login(page);
    if (!loginData.status) {
      if (loginData.isPortalError) {
        await browser.close();
      }
      throw new Error(loginData.data);
    }
    loginControl = true;

    await sleep(1000);
    console.log('Login concluido com sucesso. Iniciando desbloqueio...');
    const unlock = await UnlockUser(page, params);
    if (!unlock.status) {
      throw new Error(unlock.data);
    }
    logoutData = await logoutFacta(unlock.data);








    

    // console.log(params)
    // console.log('Login concluido com sucesso. Iniciando desbloqueio...');
    // const unlock = await UnlockUser(loginData.data, params);
    // if (!unlock.status) {
    //   throw new Error(unlock.data);
    // }
    // logoutData = await logoutBmg(unlock.data);

    // console.log('Desbloqueio concluido com sucesso. Iniciando checagem de email...');
    // const emailParams = {
    //   email: process.env.EMAIL_SUPORTE_LOGIN,
    //   emailPassword: process.env.PASS_SUPORTE_LOGIN,
    //   emailHost: process.env.IMAP_HOST,
    //   emailPort: parseInt(process.env.IMAP_PORT),
    //   emailSubject: process.env.BMG_RECOVERY_EMAIL_SUBJECT,
    //   emailSender: process.env.BMG_RECOVERY_EMAIL_SENDER,
    //   emailBankText: 'BMG Consig',
    //   ...params
    // };

    // const checkEmailResult = await CheckInbox(page, emailParams);
    // if (!checkEmailResult.status) {
    //   throw new Error(checkEmailResult.data);
    // }

    // const {
    //   pageEmail = null,
    //   user = null,
    //   pass = null
    // } = checkEmailResult.data || {};

    // if (!user || !pass) {
    //   throw new Error('Falha ao obter dados do usuário ou senha');
    // }

    // await sleep(1000);
    // await browser.close();

    // return {
    //   status: true,
    //   response: 'Usuário desbloqueado e senha resetada com sucesso.',
    //   data: { user, pass },
    // };
  } catch (err) {
    await sleep(1000);
    // !logoutData.status && loginControl ? await logoutBmg(page): '';
    await sleep(1000);
    // await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
