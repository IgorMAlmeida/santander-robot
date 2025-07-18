// import { verifyHasUser } from "./verifyHasUser.js";
// import { createUser } from "./createUser.js";
import logger from "../../../utils/logger.js";
import login from "../login.js";
import { initialize } from "../../../utils/InitializePuppeteer.js";
import { PAN_CONFIG } from "./config.js";
import { validateCertificates, validateBody } from "./validation.js";
import { fileURLToPath } from 'url';
import { blockUnnecessaryRequests, sleep } from '../../../../utils.js';
import { KnownDevices } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import UserAgent from 'user-agents';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { sl } from "zod/v4/locales";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../Anticaptcha/anticaptcha-plugin');

const pluginStealth = StealthPlugin();
pluginStealth.enabledEvasions.delete('chrome.runtime');
pluginStealth.enabledEvasions.delete('iframe.contentWindow');
// puppeteer.use(pluginStealth);
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const tempProfile = mkdtempSync(path.join(tmpdir(), 'puppeteer_profile_'));

export async function CreateControllerPan(body) {

  const validatedBody = validateBody(body);
  const dir = '../../../user_data';
  const browser = await puppeteer.launch({
    // userDataDir: dir,
    headless: false,
    devtools: true,
    timeout: 60000,
    slowMo: 0,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    pipe: false,
    dumpio: false,
    handleSIGINT: true,
    handleSIGTERM: true,
    handleSIGHUP: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1006',
      '--incognito',
      // '--disable-extensions-except=' + configPath,
      // '--load-extension=' + configPath,
    ],
    executablePath: executablePath(),
    ignoreDefaultArgs: ['--enable-automation', '--disable-extensions'],
  });

  const pages = await browser.pages();
  const page = pages[0];
  // await page.goto(url, { waitUntil: 'networkidle2' });
  // const context = await browser.createIncognitoBrowserContext();
  // const page = await context.newPage();
  // const pages = await browser.pages();
  // if (pages.length > 1) await pages[0].close();
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.setViewport({
    width: 1920,
    height: 1006
  });

  const override = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    platform: 'Win32',
  };
  const client = await page.target().createCDPSession();
  await client.send('Network.setUserAgentOverride', override);

  await page.emulateTimezone('America/Sao_Paulo'); // ou Europe/Amsterdam

  await page.evaluateOnNewDocument(() => {
    const customRTC = (target) => {
      return undefined;
    };
    window.__defineGetter__('MediaStreamTrack', () => customRTC('window.MediaStreamTrack'));
    window.__defineGetter__('RTCPeerConnection', () => customRTC('window.RTCPeerConnection'));
    window.__defineGetter__('RTCSessionDescription', () => customRTC('window.RTCSessionDescription'));
    window.__defineGetter__('webkitMediaStreamTrack', () => customRTC('window.webkitMediaStreamTrack'));
    window.__defineGetter__('webkitRTCPeerConnection', () => customRTC('window.webkitRTCPeerConnection'));
    window.__defineGetter__('webkitRTCSessionDescription', () => customRTC('window.webkitRTCSessionDescription'));
    navigator.mediaDevices.__defineGetter__('getUserMedia', () => customRTC('navigator.mediaDevices.getUserMedia'));
    navigator.__defineGetter__('webkitGetUserMedia', () => customRTC('navigator.webkitGetUserMedia'));
    navigator.__defineGetter__('getUserMedia', () => customRTC('navigator.getUserMedia'));

    const fnSW = () => { };
    navigator.serviceWorker.register = () => new Promise(fnSW, fnSW);
  });

  page.on('dialog', async (dialog) => {
    await page.waitForTimeout(Math.floor(Math.random() * 1000) + 1000);
    await dialog.accept();
  });

  // await blockUnnecessaryRequests(page);

  try {
    // await validateCertificates(page, validatedBody);
    console.log("Iniciando autenticação do usuário");

    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const url = process.env.PAN_URL;
    const username = process.env.PAN_USER;
    const partner = process.env.PAN_PARTNER;
    const password = process.env.PAN_PASS;

    logger.info("Acessando URL:", url);
    // await page.setCacheEnabled(false);
    // await page.goto(url, { waitUntil: 'networkidle2' });
    // await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    // await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(1000);
    // await page.reload({ waitUntil: 'networkidle2'});
    logger.debug("Navegou para página de login");
    await sleep(2000000);

    logger.debug("Acessando URL:", url);
    await page.type(`::-p-xpath(${PAN_LOGIN_CONFIG.SELECTORS.USERNAME_FIELD})`, username);

    // await authenticateUser(page);
    console.log("Depois do login");

    return {
      status: true,
      response: "Usuário autenticado com sucesso",
    };

  } catch (error) {
    logger.logError("Erro ao criar usuário", {
      error: error.message,
      cpf: validatedBody.cpf,
      stack: error.stack
    });
    throw error;
  } finally {
    await browser.close();
  }
}


async function authenticateUser(page) {
  // const { status, data: FISession } = await login(page);,
  console.log("Chamou o login");
  return await login(page);

  // if (!status) {
  //   throw new Error(PAN_CONFIG.ERRORS.LOGIN_FAILED);
  // }

  // return FISession;
}
