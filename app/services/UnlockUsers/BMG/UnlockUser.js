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
    console.log("---------- Entrou no desbloqueio do Usuario---------------------");

    const sanitizedCPF = await sanitizeCPF(param.cpf);
    if(sanitizedCPF == ''){
      throw new Error('Invalid CPF');
    }

    await page.goto('https://www.bmgconsig.com.br/principal/sidebar.jsp', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    console.log('URL sidebar:', page.url());
    await clickElementByXpath(page, '//*[@id="slidingMenu"]/form/div[8]/a');
    await clickElementByXpath(page, '//*[@id="accordion-8"]/ul/li[1]/a');

    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=prepare', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('URL de busca:', page.url());
    await sleep(1000);

    let user = await searchUser(page, [sanitizedCPF, param.user]);
    if(!user.status){
      throw new Error(user.data)
    }

    page = user.data;
    console.log("busca do termo de bloqueio no alttxt", page.url());
    const altText = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    console.log('altText:', altText);
    if (altText === 'Bloquear') {
      return {
        status: true,
        data: page,
        message: 'Usuário já desbloqueado.'
      };
      throw new Error('Usuário já desbloqueado');
    }

    console.log("passou do teste de user desbloqueado");
    await sleep(1500);

    await clickElementByXpath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[2]/a/img');
    
    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=4B8E6AA7A4B34344B43AF860DA0AD9D2&alterouUsuario=true&acao=DESBLOQUEAR', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', obsUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');

    await sleep(1000);
    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const messageText = await checkElementAndText(page, '/html/body/table/tbody/tr/td/p/font'); //mensagem pós desbloqueio
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

    user = await searchUser(page, [sanitizedCPF, param.user]);
    if(!user.status){
      throw new Error(user.data)
    }
    await sleep(1000);
    page = user.data;
    console.log('pós busca d usuario')
    console.log(page.url())
    const altTextResetPass = await getAltTextByXPath(page, '//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a/img');//clique no botao de reset de senha
    if (altTextResetPass !== 'Reinicializar senha') {
      throw new Error('Reset de senha nao disponivel');
    }

    //Pega a url referencia para envio de email
    // https://www.bmgconsig.com.br/cadastro/usuario/formaEnvioSenha.jsp?codigoUsuario=6C986F83F2384A2B85E3CFFF9D09F0F7       url send mail
    let popupUrl = await getLinkByXPath(page,'//*[@id="usuario"]/tbody/tr/td[8]/table/tbody/tr/td[5]/a');
    console.log('popupUrl', popupUrl);
    // popup de envio de email
    await page.goto('https://www.bmgconsig.com.br/cadastro/usuario/formaEnvioSenha.jsp?codigoUsuario=4B8E6AA7A4B34344B43AF860DA0AD9D2', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('url reset pass', page.url());
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
   
    await page.goto('https://www.bmgconsig.com.br/cadastroUsuario.do?method=abrirObservacoes&codigoUsuario=4B8E6AA7A4B34344B43AF860DA0AD9D2&alterouUsuario=true&acao=REINICIALIZAR_SENHA&tipoEnvioSenha=EMAIL', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.type('::-p-xpath(/html/body/form/table[2]/tbody/tr[2]/td/textarea)', resetUnlockField);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');

    return {
      status: true,
      data: page,
      message: messageText.text
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error
    };
  }


 
}
