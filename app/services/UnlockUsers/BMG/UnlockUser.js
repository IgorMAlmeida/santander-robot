import { clickElementByXpath, sleep , getElementTextByXpath, getAltTextByXPath} from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";

const obsUnlockField = 'D';
export async function UnlockUser(page, param) {
  try {
    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if(sanitizedCPF == ''){
      throw new Error('Invalid CPF');
    }
    console.log('url...',page.url());

    const sidebar = page;
    sidebar.goto('https://www.bmgconsig.com.br/principal/sidebar.jsp')
    
    console.log('url sidebar...',page.url());
    await clickElementByXpath(sidebar, '//*[@id="slidingMenu"]/form/div[8]/a');
    await clickElementByXpath(sidebar, '//*[@id="accordion-8"]/ul/li[1]/a');
    await sleep(15000);
    console.log('url page...',page.url());
    console.log('url sidebar...',sidebar.url());
    page.type('::-p-xpath(/html/body/form/table[1]/tbody/tr[2]/td/table/tbody/tr[4]/td[2]/input)', sanitizedCPF);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
    
    const erroNotFound = await getElementTextByXpath(page, '/html/body/form/table[3]/tbody/tr/td/span[1]');
    if(erroNotFound){
      throw new Error(erroNotFound.text);
    }

    const altText = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    if(altText === 'Desbloquear'){
      return {
        status: true,
        data: page,
        message: 'Usuario ja desbloqueado'
      }
    }

    await clickElementByXpath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', obsUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
    await sleep(15000);

    return {
      status: true,
      data: page
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error
    };
  }
}
