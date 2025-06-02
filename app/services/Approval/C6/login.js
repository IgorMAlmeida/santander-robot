import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
import logger from "../../../utils/logger.js";

dotenv.config();

export async function login(page, credentials) {
  logger.info("Starting C6 approval login process");
  
  try {
    const url = process.env.C6_APROVACAO_URL;
    logger.debug("Using C6 approval URL", { url });

    const username = credentials.username;
    logger.debug("Login attempt", { username });
    
    logger.debug("Navigating to C6 approval login page");
    await page.goto(url, { waitUntil: "networkidle0" });

    logger.debug("Extracting FISession from URL");
    const FISession = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('FISession');
    });
    logger.debug("FISession obtained", { FISession });

    logger.debug("Entering username");
    await page.type('::-p-xpath(//*[@id="EUsuario_CAMPO"])', username);

    logger.debug("Entering password");
    const password = credentials.password;
    await page.type('::-p-xpath(//*[@id="ESenha_CAMPO"])', password);
    
    logger.debug("Clicking login button");
    await clickElementByXpath(page,'//*[@id="lnkEntrar"]');

    page.on('dialog', async dialog => {
      logger.debug(`Dialog detected with message: ${dialog.message()}`);
      await dialog.accept();
    });
  
    logger.debug("Waiting for navigation after login");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    logger.debug("Navigating to approval consultation page");
    await page.goto(`https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`, { waitUntil: "networkidle0" });

    logger.info("C6 approval login successful", { username });
    return {
      status: true,
      data: FISession
    }; 
  } catch (error) {
    logger.error("Error during C6 approval login", { 
      username: credentials.username,
      error: error.message,
      stack: error.stack
    });
    
    return {
      status: false,
      data: error.message
    };
  }
}

