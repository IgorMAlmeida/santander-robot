import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
import { solveCaptcha } from "./solveCaptcha.js";
import logger from "../../../utils/logger.js";

dotenv.config();

export async function login(page, credentials) {
  logger.info("Starting Daycoval approval login process");
  
  try {
    const url = process.env.DAYCOVAL_APROVACAO_URL;
    logger.debug("Using Daycoval approval URL", { url });

    const username = credentials.username;
    logger.debug("Login attempt", { username });
    
    logger.debug("Navigating to Daycoval approval login page");
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    logger.debug("Solving captcha");
    const captchaText = await solveCaptcha(page);
    logger.debug("Entering captcha text", { captchaText });
    await page.type(
      '::-p-xpath(//*[@id="Captcha_txtCaptcha_CAMPO"])',
      captchaText
    );

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
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    logger.debug("Navigating to approval consultation page");
    await page.goto(
      `https://consignado.daycoval.com.br/Autorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx`,
      { waitUntil: "domcontentloaded" }
    );

    logger.info("Daycoval approval login successful", { username });
    return {
      status: true,
    };
  } catch (error) {
    logger.error("Error during Daycoval approval login", { 
      username: credentials.username,
      error: error.message,
    });
    
    return {
      status: false,
      data: error.message
    };
  }
}

