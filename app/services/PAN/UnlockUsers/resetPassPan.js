import dotenv from "dotenv";
import logger from "../../../utils/logger.js";
import path from 'path';
import { clickElementByXpath, checkElementAndText, sleep, typeByXpath, getElementText, clickElementByXpathInFrame, checkElementAndTextInFrames, waitForElementHiddenInFrames } from "../../../../utils.js";
import { PAN_UNLOCK_CONFIG } from "./config.js";
dotenv.config();



export default async function resetPassPan(page) {
  try {
    console.log('page', page);
    logger.info("Iniciando reset de senha de usuário PAN");

    await clickElementByXpath(page, PAN_UNLOCK_CONFIG.SELECTORS.CHANGE_FIELD);
    await sleep(1000);
    await clickElementByXpath(page, PAN_UNLOCK_CONFIG.SELECTORS.RESET_PASS_FIELD);
    await sleep(1000);
    const resetPassConfirm = await checkElementAndTextInFrames(page, PAN_UNLOCK_CONFIG.SELECTORS.RESET_PASS_CONFIRM_FIELD);
    logger.info(`Reset passa confirm text: ${resetPassConfirm.text}`);
    if (resetPassConfirm.status && !resetPassConfirm.text.includes('Deseja gerar nova senha para o usuário')) {
      throw new Error('Elemento de reset de senha nao localizado na tela.');
    }
    await clickElementByXpathInFrame(page, PAN_UNLOCK_CONFIG.SELECTORS.RESET_PASS_YES_FIELD, 5000, 'Lib/UI.PopUpMsgBooleana.aspx');
    await sleep(2000);
    await waitForElementHiddenInFrames(page, '//*[@id="ctl00_UpdPrs"]');
    await sleep(2000);

    const newPass = await checkElementAndTextInFrames(page, PAN_UNLOCK_CONFIG.SELECTORS.NEW_PASS_YES_FIELD, 50000);
    console.log('newPass', newPass);
    if (!newPass.status) {
      throw new Error(newPass.text);
    }

    await sleep(1000);
    
    return {
      status: true,
      data: newPass.text,
    };
  } catch (error) {
    return {
      status: false,
      data: error.message,
    };
  }
}
