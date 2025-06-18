import { clickElementByXpath, sleep , getElementTextByXpath, getAltTextByXPath, checkElementAndText, getLinkByXPath} from "../../../../utils.js";
import { sanitizeCPF } from "../../../helpers/sanitizeCPF.js";

const obsUnlockField = 'D';
const resetUnlockField = 'S';
 async function searchUser(page, params) {
    try{
      const [cpf, user] = params;
      await page.type('::-p-xpath(/html/body/form/table[1]/tbody/tr[2]/td/table/tbody/tr[4]/td[2]/input)',cpf);
      await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
      console.log('buscou em tdos botoes');
      await sleep(1000);

      const erroNotFound = await checkElementAndText(page, '/html/body/form/table[3]/tbody/tr/td/span[1]'); //nenhum registro encontrado
      if(erroNotFound.status){
        console.log("entrou en not found")
        await sleep(5000);
        throw new Error(erroNotFound.text);
      }

      let itensPerPage = await checkElementAndText(page, '/html/body/form/table[3]/tbody/tr/td/div/span[1]');
      if (itensPerPage.status ) {
        let itensPerPageText = itensPerPage.text;
        console.log('itensPerPage:', itensPerPageText);
        const parts = itensPerPageText.split(' de ');
        console.log('parts',parts);

        if (parts.length >= 2) {
          const totalPages = parseInt(parts[1].trim());
          if (!isNaN(totalPages) && totalPages > 1) {
            await page.type( '::-p-xpath(/html/body/form/table[1]/tbody/tr[2]/td/table/tbody/tr[2]/td[2]/input)',user); //busca por usuario
            await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
          }
        }
      } 

      return {
        status: true,
        data: page,
        message: 'User found!'
      };
    }catch(error){
      console.error('Error during searching user:', error);
      return {
        status: false,
        data: error
      };
    }
  }
export async function UnlockUser(page, param) {
  try {
    console.log("----------Entrou no desbloqueio do Usuario---------------------");
    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if(sanitizedCPF == ''){
      throw new Error('Invalid CPF');
    }

    await page.goto('https://www.bmgconsig.com.br/principal/sidebar.jsp', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await clickElementByXpath(page, '//*[@id="slidingMenu"]/form/div[8]/a');
    await clickElementByXpath(page, '//*[@id="accordion-8"]/ul/li[1]/a');

    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=prepare', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log("Busca de usuario");
    await sleep(1000);
    let user = await searchUser(page, [sanitizedCPF, param.user]);
    if(!user.status){
      throw new Error(user.data)
    }

    page = user.data;
    await sleep(1000);
    console.log("Verificando se usuario esta bloqueado pelo alt text do botao");
    const altText = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    console.log('altText:', altText);
    // if (altText.includes('Bloquear')) {
    //   return {
    //     status: true,
    //     data: page,
    //     message: 'Usuário já desbloqueado.'
    //   };
    // }

    console.log('Pegando o codigo de usuario')
    let popupUrl = await getLinkByXPath(page,'//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a');
    const match = popupUrl.match(/reinicializarSenha\('([^']+)'/);
    if (!match) {
      throw new Error('Não foi possível extrair o código do href.');
    }
    const codigoUsuario = match[1];
    console.log('Codigo de usuario:', codigoUsuario);

    console.log("Vai para url do popup de desbloqueio usuario");
    await sleep(1000);
    await clickElementByXpath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    console.log("ir para pagina de obs de desbloqueio");
    await page.goto(`https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=${codigoUsuario}&alterouUsuario=true&acao=DESBLOQUEAR`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log("Abrindo pop up de desbloqueio para inserir obs");
    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', obsUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
    
    await sleep(1000);
    const messageText = await checkElementAndText(page, '/html/body/table/tbody/tr/td/p/font'); 
    console.log("Mensagem após desbloqueio",messageText);
    if(!messageText.status){
      const messageTextError = await checkElementAndText(page, '/html/body/table[1]/tbody/tr[3]/td/table/tbody/tr/td[2]/font');
      if(!messageTextError.status){
        throw new Error(messageTextError.text);
      }
    }

    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=prepare', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log("Procura usuario novamente");
    user = await searchUser(page, [sanitizedCPF, param.user]);
    if(!user.status){
      throw new Error(user.data)
    }
    await sleep(1000);
    page = user.data;

    console.log('Pega alt text para verificar se há reset de senha disponivel');
    const altTextResetPass = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a/img');
    if (altTextResetPass !== 'Reinicializar senha') {
      throw new Error('Reset de senha nao disponivel');
    }

    console.log('Vai para URl de envio de email')
    const urlSendMail = `${process.env.BMGCONSIG_DESBLOQUEIO}/cadastro/usuario/formaEnvioSenha.jsp?codigoUsuario=${codigoUsuario}`;
    await page.goto(urlSendMail, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('clique no botao de reset de senha')
    await clickElementByXpath(page, '//*[@id="buttonLink"]');
    await sleep(1000);
    await page.goto(`https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=${codigoUsuario}&&alterouUsuario=true&acao=REINICIALIZAR_SENHA&tipoEnvioSenha=EMAIL`,{
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await sleep(1000);
    console.log('Escreve obs de reset de senha');
    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', resetUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]');
    console.log('Elemento clicado e email enviado');

    await sleep(2000);
    // await page.awaitUntilNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000  });
    const messageTextFinalizingUnlock = await checkElementAndText(page, '/html/body/table/tbody/tr/td/p/font');
    console.log('Texto checado apos desbloqueio:', messageTextFinalizingUnlock);
    if(!messageTextFinalizingUnlock.status){
      throw new Error(messageTextFinalizingUnlock.text);
    }

    return {
      status: true,
      data: page,
      message: messageTextFinalizingUnlock.text
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error
    };
  }
 
}
