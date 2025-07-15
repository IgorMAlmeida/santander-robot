import { clickElementByXpath, sleep, getElementTextByXpath, getAltTextByXPath, checkElementAndText, getLinkByXPath, clickCheckboxByValue } from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import { searchUser } from "../SearchUser.js";
import dotenv from 'dotenv';

dotenv.config();

const createUserField = 'C';

export async function CreateUserService(page, param) {
  try {
    console.log("Criação de Usuario...");
    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if (sanitizedCPF == '') {
      throw new Error('Invalid CPF');
    }

    page.on('dialog', async dialog => {
      console.log('Alert interceptado durante goto():', dialog.message());

      if (dialog.type() === 'beforeunload' ||
        dialog.message().includes('sair da página') ||
        dialog.message().includes('atualizações podem não ser salvas') ||
        dialog.message().includes('alterações feitas não sejam')
      ) {
        console.log('Aceitando alert de saída...');
        await dialog.accept();
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
    const firstName = param.name.split(' ')[0];
    const bankUser = `${firstName.toUpperCase()}${param.broker_code}${param.state_acronym}6`;
    let user = await searchUser(page, [sanitizedCPF, bankUser]);
    console.log("Verificação de usuario", user);

    await sleep(1000);
    if (user.status && user.message.includes('User found!')) {
      throw new Error(user.message)
    }

    await sleep(1000);
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
    await page.waitForSelector('#comboFiltro', {
      visible: true,
      timeout: 10000
    });
    page.select('#comboFiltro', '02');
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');

    await sleep(1000);
    console.log("Loja buscada. Criando novo Usuario:");
    const urlCreateUser = await getLinkByXPath(page, '/html/body/center[3]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[3]/td[8]/a');
    console.log("Url create Use", urlCreateUser);
    await page.goto(urlCreateUser, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log("Preenchendo dados do usuario.")
    await page.type('::-p-xpath(//*[@id="usuario.cpf"])', param.cpf);
    await page.type('::-p-xpath(//*[@id="usuario.nome"])', param.name);
    await page.type('::-p-xpath(//*[@id="usuario.dataNascimentoExibir"])', param.birth_date);
    await page.type('::-p-xpath(//*[@id="usuario.email"])', process.env.EMAIL_SUPORTE_LOGIN);
    await page.type('::-p-xpath(//*[@id="usuario.filiacao"])', param.mothers_name);
    await sleep(1000);

    const completeNumber = param.phone.toString();
    const dddNumber = completeNumber.substring(0, 2);
    const phone = completeNumber.substring(2);
    await sleep(1000);

    console.log("Telefones");
    await page.type('::-p-xpath(//*[@id="usuario.ddd"])', dddNumber);
    await page.type('::-p-xpath(//*[@id="usuario.telefone"])', phone);
    await page.type('::-p-xpath(//*[@id="usuario.dddComercial"])', dddNumber);
    await page.type('::-p-xpath(//*[@id="usuario.telefoneComercial"])', phone);
    await sleep(1000);

    console.log("Operadora de telefone");
    await page.waitForSelector('#usuario\\.operadora', {
      visible: true,
      timeout: 10000
    });
    page.select('#usuario\\.operadora', '01');
    await sleep(1000);

    console.log("Preenchendo dados de agente");
    await page.waitForSelector('#usuario\\.codigoPerfilUsuario', {
      visible: true,
      timeout: 10000
    });
    page.select('#usuario\\.codigoPerfilUsuario', 'F6D0747EAC1E070F614A1EE7009A6D7Z');

    console.log("Tipo de vinculo com loja");
    await page.waitForSelector('#comboTipoVinculo', {
      visible: true,
      timeout: 10000
    });
    page.select('#comboTipoVinculo', '3');
    await sleep(1000);

    console.log("Usuario");
    await page.type('::-p-xpath(//*[@id="usuario.login"])', bankUser);

    console.log("Acesso a telas");
    await clickCheckboxByValue(page, 512);
    await clickCheckboxByValue(page, 557);
    await clickCheckboxByValue(page, 494);
    await sleep(1000);

    console.log("Salvar");
    await clickElementByXpath(page, '//*[@id="submitButton"]/span');
    await sleep(1000);
    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=&alterouUsuario=true&acao=INSERIR&impedidosOperar=false', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await sleep(1000);
    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', createUserField);
    await sleep(1000);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
    await sleep(1000);

    const concludeMessage = await checkElementAndText(page, '/html/body/table[1]/tbody/tr[4]/td');
    if (concludeMessage.status && concludeMessage.text.includes('O telefone informado')) {
      throw new Error(concludeMessage.text.trim());
    }
    await sleep(1000);

    return {
      status: true,
      data: { 
        page: page,
        bank_user: bankUser,
        cpf: param.cpf,
        name: param.name,
        birth_date: param.birth_date,
        mothers_name: param.mothers_name,
        phone: completeNumber
      },
      message: 'Usuario criado.'
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error,
      message: 'Error during creating user.'
    };
  }
}
