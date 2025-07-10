import { clickElementByXpath, sleep, getElementTextByXpath, getAltTextByXPath, checkElementAndText, getLinkByXPath } from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import { searchUser } from "../SearchUser.js";

const obsUnlockField = 'D';
const resetUnlockField = 'S';

export async function CreateUserService(page, param) {
  try {
    console.log("Criação de Usuario...");
    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if (sanitizedCPF == '') {
      throw new Error('Invalid CPF');
    }

    await sleep(1000);
    page.on('dialog', async dialog => {
      const message = dialog.message();
      console.log('Dialog detectado:', message);

      try {
        if (dialog.type() === 'beforeunload') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
      } catch (err) {
        console.error('Erro ao lidar com dialog:', err.message);
      }
    });
    await sleep(1000);
    await page.goto('https://www.bmgconsig.com.br/principal/sidebar.jsp', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    page.removeAllListeners('dialog');

    await clickElementByXpath(page, '//*[@id="slidingMenu"]/form/div[8]/a');
    await clickElementByXpath(page, '//*[@id="accordion-8"]/ul/li[1]/a');

    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=prepare', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log("Buscando usuario...");
    await sleep(1000);
    let user = await searchUser(page, [sanitizedCPF, param.user]);
    console.log("Verificação de usuario", user);
    if (user.status && user.message.includes('User found!')){
      throw new Error(user.data)
    }
    page = user.data;
    // await sleep(1000);
    // await page.goto('https://www.bmgconsig.com.br/principal/sidebar.jsp', {
    //   waitUntil: 'networkidle2',
    //   timeout: 30000
    // });
    // await sleep(1000);
    // await clickElementByXpath(page, '//*[@id="slidingMenu"]/form/div[8]/a');
    // await clickElementByXpath(page, '//*[@id="accordion-8"]/ul/li[3]/a');
    // await sleep(1000);
    await page.goto('https://www.bmgconsig.com.br/correspondente/lst_correspondente.jsp?grp=52293&csa=03C41D70543A45398F94A3B466EB2590',
      {
        waitUntil: 'networkidle2',
        timeout: 30000
      }
    );

    console.log("Busca loja da Its");
    await sleep(1000);
    await page.type('::-p-xpath(//*[@id="textoFiltro"])', process.env.BMG_STORE_COD_CREDFRANCO);
    await sleep(1000);
    await clickElementByXpath(page, '//*[@id="comboFiltro"]');
    await clickElementByXpath(page, '//*[@id="comboFiltro"]/option[2]');
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');

    console.log("Loja buscada. Criando novo Usuario:");
//    /html/body/center[3]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[3]/td[8]/a
    const urlCreateUser = await getLinkByXPath(page, '/html/body/center[3]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[3]/td[8]/a');


    await sleep(100000);

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
