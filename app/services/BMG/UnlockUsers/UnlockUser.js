import { clickElementByXpath, sleep, getElementTextByXpath, getAltTextByXPath, checkElementAndText, getLinkByXPath } from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";
import { searchUser } from "../SearchUser.js";

const obsUnlockField = 'D';
const resetUnlockField = 'S';

export async function UnlockUser(page, param) {
  try {
    console.log("----------Entrou no desbloqueio do Usuario---------------------");
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
    if (!user.status) {
      throw new Error(user.data)
    }

    page = user.data;
    await sleep(1000);
    console.log('Pegando o codigo de usuario.')
    let popupUrl = await getLinkByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a');
    const match = popupUrl.match(/reinicializarSenha\('([^']+)'/);
    if (!match) {
      throw new Error('Não foi possível extrair o código do href.');
    }

    const codigoUsuario = match[1];
    console.log('Codigo de usuario obtido. Verificando se usuario esta bloqueado pelo alt text do botao.');
    await sleep(1000);

    const altText = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    console.log('altText:', altText);
    if (altText.toUpperCase().includes('DESBLOQUEAR')) {
      console.log("Redirecionando para url do popup de desbloqueio de usuario");
      await sleep(1000);
      await clickElementByXpath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
      console.log("Redirecionando para pagina de observacao de desbloqueio");
      await page.goto(`https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=${codigoUsuario}&alterouUsuario=true&acao=DESBLOQUEAR`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log("Abrindo pop up de desbloqueio para inserir observacao");
      await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', obsUnlockField);
      await clickElementByXpath(page, '//*[@id="buttonLink"]/span');

      await sleep(1000);
      const messageText = await checkElementAndText(page, '/html/body/table/tbody/tr/td/p/font');
      console.log("Verificando menssagem de desbloqueio");
      if (!messageText.status) {
        const messageTextError = await checkElementAndText(page, '/html/body/table[1]/tbody/tr[3]/td/table/tbody/tr/td[2]/font');
        if (!messageTextError.status) {
          throw new Error(messageTextError.text);
        }
      }

      await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=prepare', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    }

    console.log("Usuario desbloqueado, procura usuario novamente");
    user = await searchUser(page, [sanitizedCPF, param.user]);
    if (!user.status) {
      throw new Error(user.data)
    }
    await sleep(1000);
    page = user.data;

    console.log('Pega alt text para verificar se há reset de senha disponivel');
    const altTextResetPass = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a/img');
    if (altTextResetPass !== 'Reinicializar senha') {
      throw new Error('Reset de senha nao disponivel');
    }

    console.log('Redirecionamento para URl de envio de email')
    const urlSendMail = `${process.env.BMGCONSIG_DESBLOQUEIO}/cadastro/usuario/formaEnvioSenha.jsp?codigoUsuario=${codigoUsuario}`;
    await page.goto(urlSendMail, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Clique no botao de reset de senha');
    await clickElementByXpath(page, '//*[@id="buttonLink"]');
    await sleep(1000);
    await page.goto(`https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=${codigoUsuario}&&alterouUsuario=true&acao=REINICIALIZAR_SENHA&tipoEnvioSenha=EMAIL`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await sleep(1000);
    console.log('Escreve observacao de reset de senha');
    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', resetUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]');
    console.log('Elemento clicado e email enviado. Aguardando mensagem de desbloqueio');
    await sleep(1000);

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
