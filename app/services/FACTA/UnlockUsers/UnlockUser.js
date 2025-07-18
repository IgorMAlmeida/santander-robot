import { clickElementByXpath, sleep, getElementTextByXpath, getAltTextByXPath, checkElementAndText, getLinkByXPath } from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import { searchUser } from "../SearchUser.js";

// const obsUnlockField = 'D';
// const resetUnlockField = 'S';

export async function UnlockUser(page, param) {
  try {
    console.log("----------Entrou no desbloqueio do Usuario---------------------");
    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if (sanitizedCPF == '') {
      throw new Error('Invalid CPF');
    }
    await sleep(1000);
    await clickElementByXpath(page, '//*[@id="main-nav"]/div/ul/li[8]/a/i[1]/img');
    

    return {
      status: true,
      data: page,
      message: 'Desbloqueado e email enviado com sucesso.'
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error
    };
  }
}