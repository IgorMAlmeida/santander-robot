import { clickElementByXpath, sleep, checkElementAndText } from "../../utils.js";
import { scrappingOlaConsult } from "./olaScrappingService.js";


export async function getConsultProposalScreen(page, codProposal) {
  
  try {
    await page.type('::-p-xpath(//*[@id="NumeroProposta"])', codProposal);
    await clickElementByXpath(page,'//*[@id="btnPesquisar"]');

    await sleep(2500);
    const messageError = await checkElementAndText(page, '//*[@id="divMensagemErro"]/ul/li');
    if(messageError.status && messageError.text === 'Nenhuma proposta encontrada para o(s) filtro(s) informado(s).') {
      throw new Error('Nenhuma proposta encontrada para o(s) filtro(s) informado(s).');
    }

    const result = await scrappingOlaConsult(page);
    if(!result.status) {
      throw new Error(result);
    }

    return { 
      status: true, 
      data: result.data
    }
  }catch (error) {
    return { 
      status: false, 
      data: error
    };
  }
}