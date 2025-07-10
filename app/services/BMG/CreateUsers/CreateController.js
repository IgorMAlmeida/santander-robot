import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { blockUnnecessaryRequests, sleep } from '../../../../utils.js';
import { logoutBmg } from '../LogoutBMG.js';
import { CertificatesConsult } from './CertificatesConsult.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginPortal } from '../LoginPortal.js';
import { CreateUserService } from './CreateUserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../Anticaptcha/anticaptcha-plugin');


puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function CreateController(params) {
console.log(configPath);

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

  try {
    await sleep(1000);
    console.log('Iniciando Verificação de certificados...');
    // const certificates = await CertificatesConsult(page, params);
    // if(!certificates.status){
    //   throw new Error(certificates.data);
    // }

    console.log("Certificados verificados. Iniciando Login BMG");
    const loginBMG = await loginPortal(page);
    if (!loginBMG.status) {
      if (loginBMG.isPortalError) {
        // await browser.close();
      }
      throw new Error(loginBMG.data);
    }

    const createUser = CreateUserService(page, params);
    if(!createUser.status){
      throw new Error(createUser.data);
    }




    await sleep(1000);

    return {
      status: true,
      response:{
          certificates: certificates.data,
          user: createUser.message
        },
      data: 'Usuário criado com sucesso.',
    };
  } catch (err) {
    await sleep(1000);
    // await logoutBmg(page);
    await sleep(1000);
    // await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
