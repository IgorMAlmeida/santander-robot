import { clickElementByXpath, sleep } from "../../../utils.js";
import { verifyTextConsult } from "./verifyTextConsult.js";

export async function consultSRCC(page, cpf) {
  try {
    const cpfFormatted = cpf[cpf.length - 1] + cpf.slice(0, 10);
    let status = "";
    await page.type('::-p-xpath(//*[@id="Cpf"])', cpfFormatted, { delay: 100 });
    await page.type('::-p-xpath(//*[@id="Matricula"])', '0123456789');

    await clickElementByXpath(page, '//*[@id="btnConsultar"]');
    await sleep(2500);

    const responseINSS = await verifyTextConsult(page);
    status = responseINSS.status

    if(!status) {
      await sleep(500);
      await clickElementByXpath(page, '//*[@id="radioOutros"]');
      await clickElementByXpath(page, '//*[@id="btnConsultar"]');
      await sleep(2500);

      const responseOthers = await verifyTextConsult(page);

      status = responseOthers.status
    }

    if(!status) {
      throw new Error("Registro não encontrado")
    }

    return { 
      status: true, 
      data: data
    }
  }catch (error) {
    return { 
      status: false, 
      data: "Registro não encontrado"
    };
  }
}