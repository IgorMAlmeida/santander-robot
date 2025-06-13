import { clickElementByXpath, getByXpath, getElementTextByXpath } from "../../../utils.js";

export async function consultSRCC(page, proposal) {
  try {
    await page.type('::-p-xpath(//*[@id="ctl00_Cph_AprCons_txtPesquisa_CAMPO"])', proposal);
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');
    await clickElementByXpath(page, '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[6]/a');
    const buttonText = await getElementTextByXpath(page, '//*[@id="ctl00_Cph_AprCons_grdConsulta"]/tbody/tr[2]/td[6]/a');
    
    await page.waitForSelector('#ctl00_Cph_AprCons_popSituacao_frameAjuda');
    const iframe = await getByXpath(page, '//*[@id="ctl00_Cph_AprCons_popSituacao_frameAjuda"]');
    const frame = await iframe.contentFrame();
    await frame.waitForSelector('#ctl00_cph_UcObs_UcObs_txtObs_CAMPO');
    
    const text = await frame.evaluate(() => {
      return document.querySelector('#ctl00_cph_UcObs_UcObs_txtObs_CAMPO').textContent;
    });
    
    if(text.includes("Proposta passível de pagamento de comissão (cliente sem registro no SRCC até o momento)") || text.includes("Consulta SRCC C Comissão")) {
      console.log(`${buttonText} - Não possui registro no SRCC`)
      return { 
        status: true, 
        data: `${buttonText} - Não possui registro no SRCC`
      }
    }

    if(text.includes("Não Passível de Comissão")) {
      console.log(`${buttonText} - Possui registro no SRCC`)
      return { 
        status: true, 
        data: `${buttonText} - Possui registro no SRCC`
      }
    }

    if(text === "") {
      console.log(`${buttonText} - Sem observação`)
      return {
        status: true,
        data: `${buttonText} - Sem observação`
      }
    }

    return { 
      status: true,
      data: `${buttonText} - ${text.split('\n').join(" || ")}`
    }
  }catch (error) {
    console.error(error)
    return { 
      status: false, 
      data: "Registro não encontrado"
    };
  }
}
