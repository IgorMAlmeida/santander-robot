import dotenv from "dotenv";
import { clickElementByXpath, checkElementAndText, sleep } from "../../../utils.js";
import logger from "../../utils/logger.js";
import { PAN_LOGIN_CONFIG } from "./config.js";
dotenv.config();

export default async function login(page) {
  try {
    console.log("Dentro do login");
    const url      = process.env.PAN_URL;
    const username = process.env.PAN_USER;
    const partner  = process.env.PAN_PARTNER;
    const password = process.env.PAN_PASS;
    
    console.log("Acessando URL:", url);
    await page.goto(url);
    console.log("Cookies após segunda URL:", await page.cookies());
    logger.debug("Navegou para página de login");
    await sleep(2000000);
    
    logger.debug("Acessando URL:", url);
    await page.type(`::-p-xpath(${PAN_LOGIN_CONFIG.SELECTORS.USERNAME_FIELD})`, username);
    logger.debug("Campo de usuário preenchido");
    
    // await clickElementByXpath(page, PAN_LOGIN_CONFIG.SELECTORS.LOGIN_BUTTON);
    // logger.debug("Botao de login clicado");

    // const checkBiometrics = await checkElementAndText(page,'/html/body/login-page/app-leitura-qr-code-login/main/div[1]/h1/span[1]');
    // if(checkBiometrics.status && checkBiometrics.text.includes(PAN_LOGIN_CONFIG.SELECTORS.NECESSARY_BIOMETRICS)){
    //     const getBiometricsLink = await checkElementAndText(page,'/html/body/login-page/app-leitura-qr-code-login/main/div[2]/a/span');
    //     if(getBiometricsLink.status){
    //         console.log("Biometria necessária, link encontrado:", getBiometricsLink.text);
    //         throw new Error(PAN_LOGIN_CONFIG.ERRORS.BIOMETRICS_NECESSARY+": "+getBiometricsLink.text);
    //     }
    // }
    
    
    logger.logInfo("Login realizado com sucesso");
    return {
      status: true,
    //   data: sessionId,
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}