import dotenv from "dotenv";
import { clickElementByXpath } from "../../../utils.js";
import logger from "../../utils/logger.js";
import { C6_LOGIN_CONFIG } from "./config.js";

dotenv.config();

function getCredentials() {
  const url = process.env.C6_CREATE_UNLOCK_USERS_URL;
  const username = process.env.C6_CREATE_UNLOCK_USERS_LOGIN_MASTER;
  const password = process.env.C6_CREATE_UNLOCK_USERS_PASSWORD_MASTER;

  if (!url || !username || !password) {
    throw new Error(C6_LOGIN_CONFIG.ERRORS.MISSING_CREDENTIALS);
  }

  try {
    new URL(url);
  } catch {
    throw new Error(C6_LOGIN_CONFIG.ERRORS.INVALID_URL);
  }

  return { url, username, password };
}

async function navigateToLoginPage(page, url) {
  await page.goto(url, { waitUntil: C6_LOGIN_CONFIG.NAVIGATION.WAIT_UNTIL });
  logger.debug("Navegou para página de login");
}

async function extractSessionId(page) {
  const sessionId = await page.evaluate(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("FISession");
  });

  logger.debug("Session ID extraído", { hasSessionId: !!sessionId });
  console.log("Session ID extraído", { hasSessionId: !!sessionId });
  return sessionId;
}

async function fillUsername(page, username) {
  await page.type(`::-p-xpath(${C6_LOGIN_CONFIG.SELECTORS.USERNAME_FIELD})`, username);
  logger.debug("Campo de usuário preenchido");
}

async function fillPassword(page, password) {
  await page.type(`::-p-xpath(${C6_LOGIN_CONFIG.SELECTORS.PASSWORD_FIELD})`, password);
  logger.debug("Campo de senha preenchido");
}

function setupDialogHandler(page) {
  page.on("dialog", async (dialog) => {
    const dialogMessage = dialog.message();
    logger.debug("Diálogo detectado durante login", { message: dialogMessage });

    try {
      await dialog.accept();
      logger.debug("Diálogo aceito automaticamente");
    } catch (error) {
      logger.warn("Erro ao aceitar diálogo", { error: error.message });
    }
  });
}

async function performLogin(page, username, password) {
  await fillUsername(page, username);
  await fillPassword(page, password);

  setupDialogHandler(page);

  await clickElementByXpath(page, C6_LOGIN_CONFIG.SELECTORS.LOGIN_BUTTON);
  logger.debug("Clicou no botão de login");

  await page.waitForNavigation({ waitUntil: C6_LOGIN_CONFIG.NAVIGATION.WAIT_UNTIL });

  const sessionId = await extractSessionId(page);
  
  if (!sessionId) {
    throw new Error(C6_LOGIN_CONFIG.ERRORS.LOGIN_FAILED);
  }

  return sessionId;
}

export default async function login(page) {
  try {
    const { url, username, password } = getCredentials();
    
    await navigateToLoginPage(page, url);
    const sessionId = await performLogin(page, username, password);
    
    logger.logInfo("Login realizado com sucesso");
    return {
      status: true,
      data: sessionId,
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}
