import logger from "../../../utils/logger.js";
import login from "../login.js";
import searchUser from "../searchUser.js";
import { blockUnnecessaryRequests, checkElementAndText, clickElementByXpath, sleep } from '../../../../utils.js';
import { validateBody, validateCertificates } from "./validation.js";
import { fileURLToPath } from 'url';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import createUserPan from "./createUserPan.js";
import { UserAlredyExists } from "../../../errors/UserAlredyExists.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../Anticaptcha/anticaptcha-plugin');

const pluginStealth = StealthPlugin();
pluginStealth.enabledEvasions.delete('chrome.runtime');
pluginStealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(pluginStealth);

export async function CreateControllerPan(body) {

  const validatedBody = validateBody(body);
  const cacheDir = path.resolve(__dirname, '../PAN_CACHE');

  const browser = await puppeteer.launch({
    userDataDir: cacheDir,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions-except=' + configPath,
      '--load-extension=' + configPath,
    ],
    executablePath: executablePath(),
  });

  const page = await browser.newPage();

  try {
    const certificates = await validateCertificates(page, validatedBody);
    await blockUnnecessaryRequests(page);
    
    await authenticateUser(page);
    await checkUserExists(page, validatedBody.cpf);
    const userData = await createUser(page, validatedBody);

    return  { user_data: userData, certificates: certificates.data };

  } catch (error) {
    logger.logError("Erro ao criar usuário", {
      error: error.message,
      cpf: validatedBody.cpf,
      stack: error.stack
    });

    const isUserAlreadyExists = error instanceof UserAlredyExists;
    const isCertificateError = error instanceof CertificatesError;
    return {
      status: false,
      response: error.message,
      data: error.data || null,
      isUserAlreadyExists,
      isCertificateError
    };

  } finally {
    // await browser.close();
  }
}


async function authenticateUser(page) {
  const { status, data } = await login(page);

  if (!status) {
    throw new Error(data);
  }

  return { status, data };
}



async function checkUserExists(page, cpf) {
  const search = await searchUser(page, cpf);
  console.log("Usuário buscado", search.status);
  console.log(search.data);

  if (search.status) {
    throw new UserAlredyExists("Usuário já cadastrado", search.data.userData);
  }

  return search;
}

async function createUser(page, data) {
  const user = await createUserPan(page, data);

  if (!user.status) {
    throw new Error(user.data);
  }

  return user;
}

