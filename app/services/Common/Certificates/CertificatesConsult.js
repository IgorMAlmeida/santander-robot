import { checkElement, checkElementAndText, clickElementByXpath, getTableCertificatesByXpath, sleep } from "../../../../utils.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import logger from "../../../utils/logger.js";
import { AnticaptchaExtension } from "../../Anticaptcha/AnticaptchaExtension.js";
import { checkCertificatesByName, saveCertificates } from "./certificatesService.js";


async function fetchExternalCertificates(page, params, validCertificates) {
  try {
    console.log('Certificados validos', validCertificates);
    const url = process.env.CERTIFICATES_CONSULT;
    const cpf = await sanitizeCPF(params.cpf);

    console.log('Iniciando consulta de certificados para o CPF:', cpf);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await AnticaptchaExtension();
    await sleep(1000);
    await page.type('::-p-xpath(//*[@id="mat-input-0"])', cpf);
    await sleep(1000);
    await page.waitForSelector('.antigate_solver.solved', { timeout: 150000 })
      .catch(error => console.log('failed to wait for the selector: ', error));
    await sleep(1000);
    console.log('Clicando no termos e condicoes');
    try {
      await clickElementByXpath(page, '//*[@id="consulta"]/div[3]/div[2]/dspe-card/div/div/form/div[2]/div/p/a');
    } catch (err) {
      await clickElementByXpath(page, '//*[@id="consulta"]/div[3]/div[2]/form/div[2]/div/p/a');
    }
    await sleep(1000);
    console.log('Clicando no aceite dos termos e condicoes')
    await clickElementByXpath(page, '//*[@id="mat-mdc-checkbox-1-input"]');
    await sleep(1000);

    console.log('Fechando popup de termos e condicoes');
    const buttonCloseFound = await checkElement(page, '/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div/div/table/tbody/tr/td/span');
    buttonCloseFound
      ? await clickElementByXpath(page, '//*[@id="mat-mdc-dialog-2"]/div/div/app-popup-termos/div/div/form/div[2]/app-button/button')
      : await clickElementByXpath(page, '//*[@id="mat-mdc-dialog-0"]/div/div/app-popup-termos/div/div/form/div[2]/app-button/button');
    await sleep(1000);

    console.log('PopUp fechado. Clicando no botao de pesquisa.');
    await clickElementByXpath(page, '//*[@id="consulta"]/div[3]/div[2]/form/div[3]/app-button/button');
    await sleep(1000);
    console.log('Verificando se há certificados para o CPF');
    await page.waitForSelector('.mat-mdc-table.mdc-data-table__table.cdk-table', { timeout: 150000 })
      .catch(error => console.log('failed to wait for the selector: ', error));
    await sleep(5000);
    console.log('Certificados verificados. Checando tabela.');
    sleep(1000);
    const table = await getTableCertificatesByXpath(page, '/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div');
    await sleep(1000);
    if(table.length === 0) {
      const isTableEmpty = await checkElementAndText(page, '/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div/div/table/tbody/tr/td/span');
      console.log("isTableEmpty",isTableEmpty);
  
      if (!isTableEmpty.status || isTableEmpty.text.includes('não possui certificados')) {
        const message = isTableEmpty.text.includes('não possui certificados')
          ? 'CPF nao possui certificados'
          : 'Não possivel validar certificados. Consulte novamente.';
        throw new Error(message);
      }
    }
    const today = new Date().setHours(0, 0, 0, 0);
    const certificates = await validateCertificates(validCertificates, table, today);

    return {
      status: true,
      data: certificates
    }

  } catch (error) {
    console.error('Error during consult certificates:', error);
    return {
      status: false,
      message: error.message,
      data: error.data ? error.data : error.message,
      isCertificateError: error instanceof CertificatesError
    };
  }
}

async function validateCertificates(validCertificates, certificates, today = new Date()) {
  const validFlags = Object.fromEntries(
    Object.keys(validCertificates).map(key => [key, false])
  );

  for (const certificate of certificates) {
    const validDate = new Date(certificate.DataValidade);
    ///////// DESCOMENTAR ESSE TRCHO EM PRODUCAO
    // if (validDate >= today) {
      const certStr = certificate.Certificado.toLowerCase();
      for (const certKey of Object.keys(validFlags)) {
        if (certStr.includes(certKey.toLowerCase())) {
          validFlags[certKey] = true;
        }
      }
      if (Object.values(validFlags).every(flag => flag)) {
        break;
      }
    // }
  }

  const missingCerts = Object.keys(validFlags).filter(key => !validFlags[key]);

  if (missingCerts.length) {
    throw new CertificatesError(
      `CPF não possui certificados válidos necessários: ${missingCerts.join(', ')}`,
      {
        missingCertificates: missingCerts,
        foundCertificates: [...certificates]
      }
    );
  }

  return certificates;
}

async function checkCachedCertificates(cpf,validCertificates, consultaDate = new Date()) {
  const checkCertificates = await checkCertificatesByName(cpf, validCertificates, consultaDate);
  logger.debug(`Certificados verificados com sucesso: ${checkCertificates}`);
  return checkCertificates;
}

export async function CertificatesConsult(page, params, validCertificates) {
  try {
    const checkCertificates = await checkCachedCertificates(params.cpf, validCertificates, );
    let externalCertificate;
    if(!checkCertificates.status){
      externalCertificate = await fetchExternalCertificates(page, params, validCertificates);
  
      if (!externalCertificate.status) {
        console.log(`Certificados consultado. Erro: ${externalCertificate.data}`);
        if (externalCertificate.isCertificateError) {
          throw new CertificatesError(externalCertificate.message, externalCertificate.data);
        }
        throw new Error(externalCertificate.message);
      }
      console.log(externalCertificate);
      await saveCertificates(externalCertificate.data, params);
    }

    return {
      status: true,
      data: checkCertificates.result || externalCertificate.data
    }

  } catch (error) {
    console.error('Error during consult certificates:', error);
    return {
      status: false,
      message: error.message,
      data: error.data ? error.data : error.message,
      isCertificateError: error instanceof CertificatesError
    };
  }
}
