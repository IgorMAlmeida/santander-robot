import { checkElementAndText, clickElementByXpath, sleep } from "../../utils.js";
import { getProposalByCod } from "./getProposalByCod.js";
import { getProposalByCpf } from "./getProposalByCpf.js";
import { loginOle } from "./loginOle.js";
import dotenv from 'dotenv';
dotenv.config();

export async function getConsultProposalScreen(page, cpf, codProposal, date) {
  let hasReturn = true;

  try {
    await page.goto(
      "https://ola.oleconsignado.com.br/ConsultaDeProposta/Index",
      { waitUntil: "domcontentloaded" }
    );

    const error500 = await checkElementAndText(
      page,
      "/html/body/div/div/div/h1"
    );
    if (error500.status) {
      throw new Error("Error 500 OLE SITE");
    }

    let data = "";
    await sleep(1500);
    const responseCod = await getProposalByCod(page, codProposal);

    if(responseCod.status) {
      data = responseCod.data
    }

    if(!responseCod.status) {
      await sleep(1000);
      const responseCpf = await getProposalByCpf(page, cpf, codProposal, date);

      if(!responseCpf.status) {
        hasReturn = false;
      }

      data = responseCpf.data
    }
    
    if(!hasReturn) {
      await clickElementByXpath(page, '//*[@id="frm_correspondente"]/div[2]/div/a');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      await sleep(5000);
      await loginOle(page, process.env.OLE_URL_BASE, process.env.OLE_LOGIN, process.env.PASS_LOGIN);

      await sleep(1500);
      const responseCod = await getProposalByCod(page, codProposal);

      if(responseCod.status) {
        data = responseCod.data
      }

      if(!responseCod.status) {
        await sleep(1000);
        const responseCpf = await getProposalByCpf(page, cpf, codProposal, date);
        data = responseCpf.data
      }
    }

    if(!data || typeof data !== 'string') {
      throw new Error("Proposta não encontrada")
    }

    return { 
      status: true, 
      data: data
    }
  }catch (error) {
    return { 
      status: false, 
      data: error
    };
  }
}
