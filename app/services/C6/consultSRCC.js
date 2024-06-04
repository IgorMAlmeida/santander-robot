import { clickElementByXpath, getByXpath } from "../../../utils.js";

export async function consultSRCC(page, proposal) {
  try {

    await page.type('::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])', proposal);
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');
    await clickElementByXpath(page, '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[6]/a');
    
    await page.waitForSelector('#ctl00_Cph_AprCons_popSituacao_frameAjuda');
    const iframe = await getByXpath(page, '//*[@id="ctl00_Cph_AprCons_popSituacao_frameAjuda"]');
    const frame = await iframe.contentFrame();
    await frame.waitForSelector('#ctl00_cph_UcObs_UcObs_txtObs_CAMPO');
    
    const text = await frame.evaluate(() => {
      return document.querySelector('#ctl00_cph_UcObs_UcObs_txtObs_CAMPO').textContent;
    });
    
    if(text.includes("Proposta passível de pagamento de comissão (cliente sem registro no SRCC até o momento)")) {
      return { 
        status: true, 
        data: "Não possui registro no SRCC"
      }
    }

    if(text.includes("Não Passível de Comissão")) {
      return { 
        status: true, 
        data: "Possui registro no SRCC"
      }
    }

    return { 
      status: true,
      data: text.split('\n').join(" || ")
    }
  }catch (error) {
    console.error(error)
    return { 
      status: false, 
      data: "Registro não encontrado"
    };
  }
}