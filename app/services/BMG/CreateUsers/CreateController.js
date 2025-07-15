import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { blockUnnecessaryRequests, sleep } from '../../../../utils.js';
import { logoutBmg } from '../LogoutBMG.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginPortal } from '../LoginPortal.js';
import { CreateUserService } from './CreateUserService.js';
import { CertificatesConsult } from '../../Common/Certificates/CertificatesConsult.js';
import { CheckInbox } from '../../Common/Email/CheckInbox.js';
import { CertificatesError } from '../../../errors/CertificatesError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../Anticaptcha/anticaptcha-plugin');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function CreateController(params) {

  console.log(`Desbloqueando usuário para o banco Master com parâmetros:`);
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--allow-running-insecure-content',
      '--disable-blink-features=AutomationControlled',
      '--mute-audio',
      '--no-zygote',
      '--no-xshm',
      '--window-size=1280,720',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-certificate-errors',
      '--lang=en-US,en;q=0.9',
      '--password-store=basic',
      '--disable-gpu-sandbox',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-infobars',
      '--disable-breakpad',
      '--disable-canvas-aa',
      '--disable-2d-canvas-clip-aa',
      '--disable-gl-drawing-for-tests',
      '--enable-low-end-device-mode',
      '--disable-extensions-except=' + configPath,
      '--load-extension=' + configPath,
    ],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()
  });

  const page = await browser.newPage();
  // await blockUnnecessaryRequests(page);
  let logoutData = {status:false, data:""};
  let loginControl = false;

  try {
    await sleep(1000);
    console.log('Iniciando Verificação de certificados...');
    const certificates = await CertificatesConsult(page, params);
    if (!certificates.status) {
      if (certificates.isCertificateError) {
        throw new CertificatesError(certificates.message, certificates.data);
      }
      throw new Error(certificates.data);
    }

    console.log("Certificados verificados. Iniciando Login BMG");
    const loginBMG = await loginPortal(page);
    if (!loginBMG.status) {
      if (loginBMG.isPortalError) {
        await browser.close();
      }
      throw new Error(loginBMG.data);
    }
    loginControl = true;
    const createUser = await CreateUserService(loginBMG.data, params);
    if (!createUser.status) {
      throw new Error(createUser.data);
    }

    const { create_user_page, ...userData } = createUser.data;
    logoutData = await logoutBmg(page);

    console.log('Criacao concluido com sucesso. Iniciando checagem de email...');
    const emailParams = {
      email: process.env.EMAIL_SUPORTE_LOGIN,
      emailPassword: process.env.PASS_SUPORTE_LOGIN,
      emailHost: process.env.IMAP_HOST,
      emailPort: parseInt(process.env.IMAP_PORT),
      emailSubject: process.env.BMG_FIRST_ACCESS_EMAIL_SUBJECT,
      emailSender: process.env.BMG_RECOVERY_EMAIL_SENDER,
      emailBankText: 'BMG Consig',
      user: userData.bank_user,
      ...params,
    };

    await sleep(5000);
    const checkEmailResult = await CheckInbox(page, emailParams);
    if (!checkEmailResult.status) {
      throw new Error(checkEmailResult.data);
    }

    const {
      pageEmail = null,
      user = null,
      pass = null
    } = checkEmailResult.data || {};

    if (!user || !pass) {
      throw new Error('Falha ao obter dados do usuário ou senha');
    }
    const { page: Emailpage, ...userDataClean } = userData;

    await browser.close();
    return {
      status: true,
      response: 'Usuário criado com sucesso.',
      data: {
        user_data: [
          {
            ...userDataClean,
            user: user,
            pass: pass
          }
        ],
        certificates: certificates.data,
      },
    };
  } catch (err) {
    await sleep(1000);
    !logoutData.status && loginControl ? await logoutBmg(page): '';
    await sleep(1000);
    await browser.close();
    const isCertificateError = err instanceof CertificatesError;

    return {
      status: false,
      response: err.message,
      data: isCertificateError ? err.data : null,
      isCertificateError: isCertificateError
    };
  }
}
