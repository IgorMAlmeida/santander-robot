import { clickElementByXpath, sleep } from "../../../utils.js";
import { needWait } from "./needWait.js";
import { verifyTextConsult } from "./verifyTextConsult.js";

export async function consultSRCC(page, cpf) {
  try {
    const cpfFormatted = cpf[cpf.length - 1] + cpf.slice(0, 10);

    await page.type('::-p-xpath(//*[@id="Cpf"])', cpfFormatted, { delay: 100 });
    await page.type('::-p-xpath(//*[@id="Matricula"])', '0123456789');
    await clickElementByXpath(page, '//*[@id="radioOutros"]');
    await clickElementByXpath(page, '//*[@id="btnConsultar"]');
    await needWait(page);

    const responseINSS = await verifyTextConsult(page);

    if(!responseINSS.status) {
      await sleep(500);
      await clickElementByXpath(page, '//*[@id="radioInss"]');
      await clickElementByXpath(page, '//*[@id="btnConsultar"]');
      await needWait(page);

      const responseOthers = await verifyTextConsult(page);

      if(!responseOthers.status) {
        throw new Error("Registro não encontrado")
      }
    }

    return { 
      status: true, 
      data: "Registro encontrado"
    }
  }catch (error) {
    return { 
      status: false, 
      data: "Registro não encontrado"
    };
  }
}