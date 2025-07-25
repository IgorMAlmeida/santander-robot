import dotenv from "dotenv";
import logger from "../../../utils/logger.js";
import path from 'path';
import { clickElementByXpath, checkElementAndText, sleep, typeByXpath, getElementText } from "../../../../utils.js";
import { PAN_CREATE_CONFIG } from "./config.js";
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//CORRIGIR PATH PARA CONTRATOS E DOCS
const contractFilePath = path.resolve(__dirname, '../Documents/Contracts/AdobeScan15dejul_2025_07_21_09_27_00.pdf');
const documentFilePath = path.resolve(__dirname, '../Documents/Identifications/rgfrente_2025_07_23_10_48_20.jpeg');

const mapDocumentType = {
  'RG': PAN_CREATE_CONFIG.SELECTORS.DOCUMENT_VALUE_RG_FIELD,
  'CNH': PAN_CREATE_CONFIG.SELECTORS.DOCUMENT_VALUE_CNH_FIELD,
};

export default async function createUserPan(page, data) {
  try {
    console.log(data);
    logger.info("Iniciando criação de usuário PAN");

    await sleep(1000);
    const completeNumber = data.phone.toString();
    const dddNumber = completeNumber.substring(0, 2);
    const phone = completeNumber.substring(2);


    await sleep(1000);
    const addressNumber = data.address.split(',')[1].trim();
    console.log("Numero endereço", addressNumber);

    logger.info("Preenchendo dados do usuário - PAN");
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.CPF_FIELD, data.cpf);
    logger.debug(`CPF preenchido:  ${data.cpf}`);
    await sleep(2000);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.NAME_FIELD, data.name);
    logger.debug(`Nome preenchido: ${data.name}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.EMAIL_FIELD, data.email);
    logger.debug(`Email preenchido: ${data.email}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.BIRTH_DATE_FIELD, data.birth_date);
    logger.debug(`Nascimento preenchido: ${data.birth_date}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.CEP_FIELD, data.cep);
    logger.debug(`Cep preenchido: ${data.cep}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.ADDRESS_NUMBER_FIELD, addressNumber);
    logger.debug(`Numero de endereço preenchido: ${addressNumber}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.DDD_CELPHONE_FIELD, dddNumber);
    logger.debug(`DDD preenchido: ${dddNumber}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.CELPHONE_FIELD, phone);
    logger.debug(`Celular preenchido: ${phone}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.DDD_PHONE_FIELD, dddNumber);
    logger.debug(`Número DDD preenchido: ${dddNumber}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.PHONE_FIELD, phone);
    logger.debug(`Telefone preenchido: ${phone}`);
    await typeByXpath(page, PAN_CREATE_CONFIG.SELECTORS.MOTHERS_NAME_FIELD, data.mothers_name);
    logger.debug(`Telefone preenchido: ${phone}`);
    await sleep(2000);
    await page.select(PAN_CREATE_CONFIG.SELECTORS.PROFILE_SELECTOR_FIELD_ID, PAN_CREATE_CONFIG.SELECTORS.PROFILE_VALUE_FIELD);
    await sleep(1000);
    await page.select(PAN_CREATE_CONFIG.SELECTORS.RESTRICT_PROFILE_SELECTOR_FIELD_ID, PAN_CREATE_CONFIG.SELECTORS.RESTRICT_PROFILE_VALUE_FIELD);
    await sleep(1000);
    await page.select(PAN_CREATE_CONFIG.SELECTORS.MASTER_PROMOTER_SELECTOR_FIELD_ID, PAN_CREATE_CONFIG.SELECTORS.MASTER_PROMOTER_VALUE_FIELD);
    await sleep(1000);
    await page.select(PAN_CREATE_CONFIG.SELECTORS.CONTRACT_TYPE_SELECTOR_FIELD_ID, PAN_CREATE_CONFIG.SELECTORS.CONTRACT_TYPE_VALUE_FIELD);
    await sleep(1000);
    await page.select(PAN_CREATE_CONFIG.SELECTORS.DOCUMENT_SELECTOR_FIELD_ID, mapDocumentType[data.document_type]);

    await sleep(1000);
    const [contractInput] = await page.$$(`::-p-xpath(${PAN_CREATE_CONFIG.SELECTORS.CONTRACT_INPUT_SELECTOR_FIELD})`);
    if (!contractInput) throw new Error(`${PAN_CREATE_CONFIG.ERRORS.INPUT_FILE_NOT_FOUND} - Documento`);
    console.log("Arquivo de contrato:", contractInput);
    await contractInput.uploadFile(contractFilePath);
    await Promise.all([
      clickElementByXpath(page, PAN_CREATE_CONFIG.SELECTORS.CONTRACT_TYPE_UPLOAD_FIELD),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    const [identificationInput] = await page.$$(`::-p-xpath(${PAN_CREATE_CONFIG.SELECTORS.DOCUMENT_INPUT_FIELD})`);
    if (!identificationInput) throw new Error(`${PAN_CREATE_CONFIG.ERRORS.INPUT_FILE_NOT_FOUND} - RG`);
    console.log("Arquivo de documento:", documentFilePath);
    await identificationInput.uploadFile(documentFilePath);
    await Promise.all([
      clickElementByXpath(page, PAN_CREATE_CONFIG.SELECTORS.DOCUMENT_UPLOAD_FIELD),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await clickElementByXpath(page, PAN_CREATE_CONFIG.SELECTORS.CONFIRM_BUTTON_FIELD);
    await sleep(2000);
    page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const pass = checkElementAndText(page, PAN_CREATE_CONFIG.SELECTORS.PASS_FIELD);
    if(!pass.status){
      throw new Error(`Campo de senha não encontrado: ${PAN_CREATE_CONFIG.ERRORS.PASS_FIELD_NOT_FOUND}`);
    }

    const userdata = {
      login: higienizeCPF(data.cpf),
      password: pass.text,
    }

    return {
      status: true,
      data: userdata,
    };
  } catch (error) {
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
