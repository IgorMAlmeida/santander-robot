import logger from "../../../utils/logger.js";
import login from "../login.js";
import searchUser from "../searchUser.js";
import { blockUnnecessaryRequests, checkElementAndText, clickElementByXpath, sleep } from '../../../../utils.js';
import { validateBody } from "./validation.js";
import { fileURLToPath } from 'url';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { UserAlredyExists } from "../../../errors/UserAlredyExists.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import UnlockUserPan from "./UnlockUserPan.js";
import resetPassPan from "./resetPassPan.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../Anticaptcha/anticaptcha-plugin');

const pluginStealth = StealthPlugin();
pluginStealth.enabledEvasions.delete('chrome.runtime');
pluginStealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(pluginStealth);

export async function UnlockControllerPan(body) {

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
    await blockUnnecessaryRequests(page);

    await authenticateUser(page);
    const userData = await checkUserExists(page, validatedBody.cpf);
    const userPage = await unlockUser(page, validatedBody, userData.data.userData);
    const resetPass = await resetPassUser(userPage.data);

    console.log("User data", userData.data.userData);
    const newPass = resetPass.data;
    return {
      status: true,
      response: "Usuário desbloqueado com sucesso",
      data: {
        cpf: userData.data.userData[0].CPFUsuario,
        user: userData.data.userData[0].NomeUsuario,
        pass: newPass
      }
    };

  } catch (error) {
    logger.logError("Erro ao criar desbloquear", {
      error: error.message,
      cpf: validatedBody.cpf,
      stack: error.stack
    });

    const isUserAlreadyExists = error instanceof UserAlredyExists;
    const isCertificateError = error instanceof CertificatesError;
    return {
      status: false,
      response: error.message,
      data: error.data || error.message,
      isUserAlreadyExists,
      isCertificateError
    };

  } finally {
    await browser.close();
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

  if (!search.status) {
    throw new Error("Usuario não encontrado");
  }


  return search;
}

async function unlockUser(page, data, userData) {
  const user = await UnlockUserPan(page, data, userData);

  if (!user.status) {
    throw new Error(user.data);
  }

  return user;
}

async function resetPassUser(page) {
  const reset = await resetPassPan(page);

  if (!reset.status) {
    throw new Error(reset.data);
  }

  return reset;
}