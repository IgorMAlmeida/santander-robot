import { clickElementByXpath, sleep } from "../../utils.js";
import { scrappingOlaConsult } from "./olaScrappingService.js";

export async function getProposalByCod(page, codProposal) {
    try {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.type('::-p-xpath(//*[@id="NumeroProposta"])', codProposal);
        await clickElementByXpath(page, '//*[@id="btnPesquisar"]');
  
        await sleep(2500);
        const scrapping = await scrappingOlaConsult(page);
  
        if(!scrapping.status) {
          throw new Error(scrapping.data)
        }
        
        return {
          status: true,
          data: scrapping.data
        }
    } catch (error) {
        return { 
          status: false, 
          data: error
        };
    }
}