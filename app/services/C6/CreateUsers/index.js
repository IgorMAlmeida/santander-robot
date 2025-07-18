import logger from "../../../utils/logger.js";
import login from "../login.js";
import { verifyHasUser } from "./verifyHasUser.js";
import { createUser } from "./createUser.js";
import { initialize } from "../../../utils/InitializePuppeteer.js";
import { C6_CONFIG } from "./config.js";
import { validateCertificates, validateBody } from "./validation.js";

export async function CreateUserC6(body) {
  const validatedBody = validateBody(body);
  
  const { page, browser } = await initialize();
  
  try {
    await validateCertificates(page, validatedBody);
    
    const sessionId = await authenticateUser(page);
    
    await navigateToCreateUserPage(page, sessionId);
    
    await checkUserExists(page, validatedBody.cpf);
    
    await createUser(page, validatedBody);
    
    logger.logInfo("Usuário criado com sucesso", { cpf: validatedBody.cpf });
    
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
  const { status, data: FISession } = await login(page);

  if (!status) {
    throw new Error(C6_CONFIG.ERRORS.LOGIN_FAILED);
  }

  return FISession;
}

async function navigateToCreateUserPage(page, sessionId) {
  const createUnlockUrl = `${C6_CONFIG.CREATE_UNLOCK_URL}?FISession=${sessionId}`;
  await page.goto(createUnlockUrl, { waitUntil: "networkidle0" });
}

async function checkUserExists(page, cpf) {
  const hasUser = await verifyHasUser(page, cpf);

  if (hasUser) {
    throw new Error(C6_CONFIG.ERRORS.USER_EXISTS);
  }
}