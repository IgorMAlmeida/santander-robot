import dotenv from "dotenv";
import logger from "../../../utils/logger.js";
import { clickElementByXpath, checkElementAndText, sleep, typeByXpath, getElementText, waitForElementHiddenInFrames, clickElementByXpathInFrame, checkElementAndTextInFrames } from "../../../../utils.js";
import { QUERO_MAIS_CREATE_CONFIG } from "./config.js";
dotenv.config();

const address = {
    'CEP': QUERO_MAIS_CREATE_CONFIG.ADDRESS.CEP_FIELD,
    'UF': QUERO_MAIS_CREATE_CONFIG.ADDRESS.UF_FIELD,
    'City': QUERO_MAIS_CREATE_CONFIG.ADDRESS.CITY_FIELD,
    'District': QUERO_MAIS_CREATE_CONFIG.ADDRESS.NEIGHBOUR_FIELD,
    'Address': QUERO_MAIS_CREATE_CONFIG.ADDRESS.ADDRESS_FIELD,
    'Number': QUERO_MAIS_CREATE_CONFIG.ADDRESS.ADDRESS_NUMBER_FIELD
}

export default async function createUserPan(page, data) {
  try {
    console.log(data);
    logger.info("Iniciando criação de usuário PAN");

    await sleep(1000);
    const completeNumber = data.phone.toString();
    const dddNumber = completeNumber.substring(0, 2);
    const phone = completeNumber.substring(2);

    await sleep(1000);
    console.log("Endereço", address);

    logger.info("Preenchendo dados do usuário - PAN");
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.CPF_FIELD, data.cpf);
    logger.debug(`CPF preenchido:  ${data.cpf}`);
    await sleep(2000);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.NAME_FIELD, data.name);
    logger.debug(`Nome preenchido: ${data.name}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.EMAIL_FIELD, data.email);
    logger.debug(`Email preenchido: ${data.email}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.BIRTH_DATE_FIELD, data.birth_date);
    logger.debug(`Nascimento preenchido: ${data.birth_date}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.CEP_FIELD, address.CEP);
    logger.debug(`Cep preenchido: ${address.CEP}`);
    await sleep(1000);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.ADDRESS_NUMBER_FIELD, address.Number);
    logger.debug(`Numero de endereço preenchido: ${address.Number}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.DDD_CELPHONE_FIELD, dddNumber);
    logger.debug(`DDD preenchido: ${dddNumber}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.CELPHONE_FIELD, phone);
    logger.debug(`Celular preenchido: ${phone}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.DDD_PHONE_FIELD, dddNumber);
    logger.debug(`Número DDD preenchido: ${dddNumber}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.PHONE_FIELD, phone);
    logger.debug(`Telefone preenchido: ${phone}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.MOTHERS_NAME_FIELD, data.mothers_name);
    logger.debug(`Mae preenchida: ${data.mothers_name}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.START_DATE_OPERATION_FIELD, QUERO_MAIS_CREATE_CONFIG.OPERATION_HOURS_ACCESS.START);
    logger.debug(`Hora de inicio: ${QUERO_MAIS_CREATE_CONFIG.OPERATION_HOURS_ACCESS.START}`);
    await typeByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.END_DATE_OPERATION_FIELD, QUERO_MAIS_CREATE_CONFIG.OPERATION_HOURS_ACCESS.END);
    logger.debug(`Hora de Fim: ${QUERO_MAIS_CREATE_CONFIG.OPERATION_HOURS_ACCESS.END}`);
    await sleep(2000);
    await page.select(QUERO_MAIS_CREATE_CONFIG.SELECTORS.PROFILE_SELECTOR_FIELD_ID, QUERO_MAIS_CREATE_CONFIG.SELECTORS.PROFILE_VALUE_FIELD);
    await sleep(1000);
    await page.select(QUERO_MAIS_CREATE_CONFIG.SELECTORS.RESTRICT_PROFILE_SELECTOR_FIELD_ID, QUERO_MAIS_CREATE_CONFIG.SELECTORS.RESTRICT_PROFILE_VALUE_FIELD);
    await sleep(1000);
    await page.select(QUERO_MAIS_CREATE_CONFIG.SELECTORS.MASTER_PROMOTER_SELECTOR_FIELD_ID, QUERO_MAIS_CREATE_CONFIG.SELECTORS.MASTER_PROMOTER_VALUE_FIELD);
    await sleep(1000);

    await clickElementByXpath(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.CONFIRM_BUTTON_FIELD);
    await sleep(2000);
    page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await sleep(2000);
    await waitForElementHiddenInFrames(page, '//*[@id="ctl00_UpdPrs"]');
    await sleep(2000);
    
    const newPass = await checkElementAndTextInFrames(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.NEW_PASS_YES_FIELD, 50000);
    console.log('newPass', newPass);
    if (!newPass.status) {
      throw new Error(newPass.text);
    }

    const newUser = await checkElementAndTextInFrames(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.NEW_PASS_YES_FIELD, 50000);
    console.log('newUser', newUser);
    if (!newUser.status) {
      throw new Error(newUser.text);
    }

    await clickElementByXpathInFrame(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.GOBACK_BUTTON_FIELD, 5000, '/MenuWeb/Cadastros/Usuarios/UI.ConfirmacaoCadastroUsuarioPopUp.aspx');
    logger.info("Primeiro elemento para fechar tela de cadastro de usuario clicado");
    await sleep(2000);
    await clickElementByXpathInFrame(page, QUERO_MAIS_CREATE_CONFIG.SELECTORS.GOBACK_LOGIN_DATA_BUTTON_FIELD, 5000, '/Cadastros/Usuarios/UI.ConfirmacaoCadastroUsuarioPopUp.aspx');
    
    await sleep(9000000);
    

    const userdata = {
      login: higienizeCPF(data.cpf),
      password: pass.text,
    }

    return {
      status: true,
      data: userdata,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      data: error.message,
    };
  }
}

async function higienizeCPF(cpf){
  const apenasNumeros = cpf.replace(/\D/g, '');

  if (apenasNumeros.length < 11) {
    throw new Error('CPF incompleto. Deve conter 11 dígitos.');
  }

  const primeirosNove = apenasNumeros.slice(0, 9);
  const doisUltimos = apenasNumeros.slice(-2);

  return `${primeirosNove}-${doisUltimos}`;
}
