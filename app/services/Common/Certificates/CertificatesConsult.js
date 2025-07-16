import { checkElement, checkElementAndText, clickElementByXpath, getTableByXpath, sleep } from "../../../../utils.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import { AnticaptchaExtension } from "../../Anticaptcha/AnticaptchaExtension.js";

const validCertificates = {
  'LGPD': false,
  'Correspondente':false
};

export async function CertificatesConsult(page, params) {
  try {
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
    await clickElementByXpath(page, '//*[@id="consulta"]/div[3]/div[2]/dspe-card/div/div/form/div[2]/div/p/a');
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
    await clickElementByXpath(page, '//*[@id="consulta"]/div[3]/div[2]/dspe-card/div/div/form/div[3]/app-button/button');
    await sleep(1000);
    console.log('Verificando se há certificados para o CPF');
    const isTableEmpty = await checkElementAndText(page, '/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div/div/table/tbody/tr/td/span');
    console.log(isTableEmpty);
    if(isTableEmpty.status && isTableEmpty.text.includes('não possui certificados')) {
      throw new Error('CPF nao possui certificados');
    }

    console.log('Certificados verificados. Checando tabela.');
    sleep(1000);
    const table = await getTableByXpath(page, '/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div');
    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    }
    const today = new Date().setHours(0, 0, 0, 0);

    const certificates = [];
    for(const certificate of table){
      const validDate = parseDate(certificate.DataValidade);
      validDate.setHours(0, 0, 0, 0);
      certificates.push(certificate);

      if (!certificate.Situacao.includes('Ativo')) {
        continue;
      }

      if (validDate >= today) {
        if (certificate.Certificado.toLowerCase().includes('correspondente')) {
          validCertificates.Correspondente = true;
        }
        if (certificate.Certificado.toLowerCase().includes('lgpd')) {
          validCertificates.LGPD = true;
        }
        if (validCertificates.LGPD && validCertificates.Correspondente) {
          break;
        }
      }
    }

    if (!validCertificates.LGPD || !validCertificates.Correspondente) {
      const missingCerts = [];
      if (!validCertificates.Correspondente) missingCerts.push('Correspondente');
      if (!validCertificates.LGPD) missingCerts.push('LGPD');

      throw new CertificatesError(`CPF não possui certificados válidos necessários: ${missingCerts.join(', ')}`, {
        missingCertificates: missingCerts,
        foundCertificates: [...certificates]
      });
    }

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
