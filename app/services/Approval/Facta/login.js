import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
import logger from "../../../utils/logger.js";

dotenv.config();

export async function login(page, credentials) {
  logger.info("Starting Facta approval login process");
  
  try {
    const url = process.env.FACTA_APROVACAO_URL;
    logger.debug("Using Facta approval URL", { url });

    const username = credentials.username;
    logger.debug("Login attempt", { username });
    
    logger.debug("Navigating to Facta approval login page");
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    logger.debug("Entering username");
    await page.type('::-p-xpath(//*[@id="login"])', username);

    logger.debug("Entering password");
    const password = credentials.password;
    await page.type('::-p-xpath(//*[@id="senha"])', password);
    
    logger.debug("Clicking login button");
    await clickElementByXpath(page, '//*[@id="btnLogin"]');

    page.on('dialog', async dialog => {
      logger.debug(`Dialog detected with message: ${dialog.message()}`);
      await dialog.accept();
    });
  
    logger.debug("Waiting for navigation after login");
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    logger.info("Facta approval login successful", { username });
    return { status: true, data: "Login realizado com sucesso" }; 
  } catch (error) {
    logger.error("Error during Facta approval login", { 
      username: credentials.username,
      error: error.message,
      stack: error.stack
    });
    
    return { status: false, data: error.message };
  }
}

