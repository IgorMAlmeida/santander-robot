import { clickElementByXpath, sleep } from "../../../../utils.js";
import dotenv from 'dotenv';
import logger from "../../../utils/logger.js";

dotenv.config();

export async function login(page, credentials) {
  logger.info("Starting OLE approval login process");
  
  try {
    const url = process.env.OLE_APROVACAO_URL;
    logger.debug("Using OLE approval URL", { url });

    const username = credentials.username;
    logger.debug("Login attempt", { username });
    
    logger.debug("Navigating to OLE approval login page");
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    logger.debug("Entering username");
    await page.type('::-p-xpath(//*[@id="Login"])', username);

    logger.debug("Entering password");
    const password = credentials.password;
    await page.type('::-p-xpath(//*[@id="Senha"])', password);
    
    logger.debug("Clicking login button");
    await clickElementByXpath(page, '//*[@id="botaoAcessar"]'); 

    logger.debug("Waiting for navigation after login");
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    logger.info("OLE approval login successful", { username });
    return { status: true }; 
  } catch (error) {
    logger.error("Error during OLE approval login", { 
      username: credentials.username,
      error: error.message,
      stack: error.stack
    });
    
    return { status: false };
  }
}

