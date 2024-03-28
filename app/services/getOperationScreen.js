import { clickElementByXpath } from "../../utils.js";
import { getByQueue } from "./getByQueue.js"

export async function getOperationScreen(page, queue, codProposal) {
  
  try {
    await clickElementByXpath(page, `/html/body/app/ui-view/base-front/header/div[4]/user-menu/div/div`);
    await clickElementByXpath(page, `//*[@id="header"]/div[4]/user-menu/div/nav/div/div[3]/ul/li[2]/a`);
    await new Promise(resolve => setTimeout(resolve, 4000));

    const pages = await page.browser().pages();
    let targetPage;
  
    for (const currentPage of pages) {
      const url = await currentPage.url();
      if (url.includes('https://consignado.santander.com.br/Portal/FI.AC.GUI.FIMENU.aspx')) { 
        targetPage = currentPage;
        break;
      }
    } 
    
    if (!targetPage) {
      console.error('Página com a URL desejada não encontrada.');
      return null;
    }
  
    await targetPage.bringToFront();
    await clickElementByXpath(targetPage, `//*[@id="ctl00_ContentPlaceHolder1_j0_j1_DataListMenu_ctl00_LinkButton2"]`);
    
    await targetPage.setRequestInterception(true);
    targetPage.on('request', (req) => {
      if (req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    return (await getByQueue(targetPage, queue, codProposal));
  }catch (error) {
    console.log(error);
  }
}
