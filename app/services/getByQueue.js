import { clickElementByXpath, elementHover, waitTimetout } from "../../utils.js";
import { scrappingProposalData } from "./scrappingService.js";

export async function getByQueue(targetPage, queue, codProposal) {
  try {
    await waitTimetout(3500);

    await elementHover(targetPage, `//*[@id="ctl00_cph_Menu1n2"]/table/tbody/tr/td[1]/a`);  
    let xpathQueue = `//*[@id="ctl00_cph_Menu1n6"]/td/table/tbody/tr/td/a`;
    let returnProposal;

    if (queue == 'finalizadas') {
      xpathQueue = `//*[@id="ctl00_cph_Menu1n7"]/td/table/tbody/tr/td/a`;
      returnProposal = await getByFinished(targetPage, xpathQueue, codProposal);
    } else {
      returnProposal = await getByProgress(targetPage, xpathQueue, codProposal);
    }
  
    return { status: true, data: returnProposal.data };
  } catch (error) {
    console.error('Error in getByQueue:', error);
    return { status: false, data: 'Error in getByQueue: ' + error.message };
  }
}


async function getByProgress(targetPage, xpathQueue, codProposal) {
  try {
    await waitTimetout(800);
    await clickElementByXpath(targetPage, xpathQueue);

    await clickElementByXpath(targetPage, `//*[@id="bbLoc_txt"]`);
    await waitTimetout(1300);
    
    const iframeElement = await targetPage.$(`#ctl00_cph_ucAprCns_popIDProp_frameAjuda`);
    const iframe = await iframeElement.contentFrame();
    await iframe.type('#ctl00_cph_j0_j1_txtPesq_CAMPO', codProposal);
    await waitTimetout(800);

    await clickElementByXpath(iframe, `//*[@id="ctl00_cph_j0_j1_bbPesq_dvTxt"]/table/tbody/tr/td`);
    
    await iframe.waitForSelector(`::-p-xpath(//*[@id="ctl00_cph_j0_j1_grResultado"]/tbody/tr/td)`);
    let element = await iframe.$(`::-p-xpath(//*[@id="ctl00_cph_j0_j1_grResultado"]/tbody/tr/td)`)
    let returnPage = await iframe.evaluate(el => el.textContent, element)

    if (returnPage.includes('Nenhum registro foi encontrado')) {
      await clickElementByXpath(iframe, `//*[@id="btnFechar_txt"]`);
      await waitTimetout(800);

      await clickElementByXpath(targetPage, `//*[@id="ctl00_cph_ucAprCns_j0_j1_bbVoltar_dvTxt"]/table/tbody/tr/td`);
      await waitTimetout(800);

      return getByQueue(targetPage, 'finalizadas', codProposal);
    }

    await clickElementByXpath(iframe, `//*[@id="ctl00_cph_j0_j1_grResultado_ctl02_lb"]`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    let data = {}
    const result = await scrappingProposalData(targetPage, data);
    return { status: true, data: result };
  } catch (error) {
    console.error('Error in getByProgress:', error);
    return { status: false, message: 'Error in getByProgress: ' + error.message };
  }
}


async function getByFinished(targetPage, xpathQueue, codProposal) {
  try {
    await waitTimetout(800);
    await clickElementByXpath(targetPage, xpathQueue);

    await clickElementByXpath(targetPage, `//*[@id="bbLoc_txt"]`);
    await waitTimetout(1300);
    
    const iframeElement = await targetPage.$(`#ctl00_cph_ucAprCns_popIDProp_frameAjuda`);
    const iframe = await iframeElement.contentFrame();
    await iframe.type('#ctl00_cph_j0_j1_txtPesq_CAMPO', codProposal);
    await waitTimetout(800);

    await clickElementByXpath(iframe, `//*[@id="ctl00_cph_j0_j1_bbPesq_dvTxt"]/table/tbody/tr/td`);  

    await iframe.waitForSelector(`::-p-xpath(//*[@id="ctl00_cph_j0_j1_grResultado"]/tbody/tr/td)`);
    let element = await iframe.$(`::-p-xpath(//*[@id="ctl00_cph_j0_j1_grResultado"]/tbody/tr/td)`)
    let returnPage = await iframe.evaluate(el => el.textContent, element)

    if (returnPage.includes('Nenhum registro foi encontrado')) {
      await clickElementByXpath(iframe, `//*[@id="btnFechar_txt"]`);
      await waitTimetout(800);

      await clickElementByXpath(targetPage, `//*[@id="ctl00_cph_ucAprCns_j0_j1_bbVoltar_dvTxt"]/table/tbody/tr/td`);
      await waitTimetout(800);

      throw new Error('Nenhum registro foi encontrado');
    }

    await clickElementByXpath(iframe, `//*[@id="ctl00_cph_j0_j1_grResultado_ctl02_lb"]`);
    await waitTimetout(800);

    let data = {}
    const result = await scrappingProposalData(targetPage, data);
    return { status: true, data: result };
  } catch (error) {
    console.error('Error in getByFinished:', error);
    return { status: false, message: 'Error in getByFinished: ' + error.message };
  }
}
