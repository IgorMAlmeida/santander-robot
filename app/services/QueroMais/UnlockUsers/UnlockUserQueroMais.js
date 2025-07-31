import dotenv from "dotenv";
import logger from "../../../utils/logger.js";
import { clickElementByXpath, checkElementAndText, sleep, unblockUnnecessaryRequests, clickElementByXpathInFrame, blockUnnecessaryRequests, waitForElementHiddenInFrames } from "../../../../utils.js";
import { QUERO_MAIS_UNLOCK_CONFIG } from "./config.js";
dotenv.config();

export default async function UnlockUserPan(page, data, userData) {
  try {
    console.log("data", data);
    console.log("userData", userData[0]);
    userData = userData[0];
    logger.info("Iniciando desbloqueio de usuário PAN");
    await unblockUnnecessaryRequests(page);
    if(userData && !userData.PromotoraMaster.includes(QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.QUERO_MAIS_PARTNER)) {
      throw new Error(`Promotora master não é CREDFRANCO para o usuario: ${data.cpf} - ${data.name}`);
    }

    if(userData.Status === 'Ativo'){
      throw new Error(`O usuario: ${data.cpf} - ${data.name} ja se encontra ativo.`);
    }
    await clickElementByXpath(page, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.CHANGE_FIELD);
    await sleep(1000);
    await waitForElementHiddenInFrames(page, '//*[@id="ctl00_UpdPrs"]');
    await sleep(1000);
    await page.select(QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.STATUS_CHANGE_FIELD, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.STATUS_CHANGE_OPTION_FIELD);
    await sleep(1000);

    if(userData.PerfilDeAcesso === 'DIGITADOR'){
      const checkDocumentationStatus = await checkElementAndText(page, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.DOCUMENTATION_STATUS_FIELD);
      if(checkDocumentationStatus.status && !checkDocumentationStatus.text.includes('Ativo')) {
        throw new Error(`O usuario: ${data.cpf} - ${data.name} não esta com documentacao ativa.`);
      }
    }

    await clickElementByXpath(page, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.CONFIRM_BUTTON_FIELD);
    await sleep(2000);
    await waitForElementHiddenInFrames(page, '//*[@id="ctl00_UpdPrs"]');
    await sleep(2000);

    await clickElementByXpathInFrame(page, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.GOBACK_BUTTON_FIELD, 5000, '/MenuWeb/Cadastros/Usuarios/UI.ConfirmacaoCadastroUsuarioPopUp.aspx');
    logger.info("Primeiro elemento para fechar tela de cadastro de usuario clicado");
    await sleep(2000);
    await clickElementByXpathInFrame(page, QUERO_MAIS_UNLOCK_CONFIG.SELECTORS.GOBACK_LOGIN_DATA_BUTTON_FIELD, 5000, '/Cadastros/Usuarios/UI.ConfirmacaoCadastroUsuarioPopUp.aspx');
    logger.info("Segundo elemento para fechar tela de cadastro de usuario clicado");
    await sleep(1000);
    await blockUnnecessaryRequests(page);
    await sleep(1000);

    return {
      status: true,
      data: page,
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}
