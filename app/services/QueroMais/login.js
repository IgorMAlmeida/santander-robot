import dotenv from "dotenv";
import { clickElementByXpath, checkElementAndText, sleep } from "../../../utils.js";
import logger from "../../utils/logger.js";
import { QUERO_MAIS_LOGIN_CONFIG } from "./config.js";
dotenv.config();

export default async function login(page) {
  try {
    console.log("Iniciando autenticação do usuário");
    const url = process.env.QUERO_MAIS_URL;
    const user_store = process.env.QUERO_MAIS_USER_AND_STORE;
    const pass = process.env.QUERO_MAIS_PASS;

    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(1000);
    logger.debug("Acessando URL:", url);
    await page.type(`::-p-xpath(${QUERO_MAIS_LOGIN_CONFIG.SELECTORS.USER_AND_STORE_FIELD})`, user_store);
    await page.type(`::-p-xpath(${QUERO_MAIS_LOGIN_CONFIG.SELECTORS.USER_PASS_FIELD})`, pass);

    await clickElementByXpath(page, QUERO_MAIS_LOGIN_CONFIG.SELECTORS.LOGIN_BUTTON);
    await sleep(1500);
    logger.debug("Login realizado com sucesso");

    return {
      status: true,
      data: "Login realizado com sucesso",
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}
