import { clickElementByXpath, sleep } from "../../../../utils.js";
import dotenv from 'dotenv';
import logger from "../../../utils/logger.js";

dotenv.config();

/**
 * Realiza login no sistema de aprovação da OLE
 * @param {Object} page - Instância da página do Puppeteer
 * @param {Object} credentials - Credenciais de login
 * @returns {Promise<Object>} Resultado do login
 */
export async function login(page, credentials) {
  logger.logMethodEntry('OLE.login', { 
    username: credentials.username,
    bankName: 'OLE'
  });
  
  try {
    const url = process.env.OLE_APROVACAO_URL;
    logger.debug("URL de login da OLE", { url });

    const username = credentials.username;
    logger.debug("Tentativa de login", { 
      username,
      bankName: 'OLE'
    });
    
    logger.debug("Navegando para a página de login da OLE", {
      url,
      waitUntil: 'domcontentloaded'
    });
    
    const navigationStartTime = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const navigationEndTime = Date.now();
    
    logger.debug("Navegação para página de login concluída", {
      url,
      navigationTimeMs: navigationEndTime - navigationStartTime,
      pageTitle: await page.title().catch(() => 'Não disponível')
    });

    logger.debug("Digitando nome de usuário", {
      selector: '::-p-xpath(//*[@id="Login"])',
      username
    });
    await page.type('::-p-xpath(//*[@id="Login"])', username);

    logger.debug("Digitando senha");
    const password = credentials.password;
    await page.type('::-p-xpath(//*[@id="Senha"])', password);
    
    logger.debug("Clicando no botão de login", {
      xpath: '//*[@id="botaoAcessar"]'
    });
    await clickElementByXpath(page, '//*[@id="botaoAcessar"]'); 

    logger.debug("Aguardando navegação após login", {
      waitUntil: 'domcontentloaded'
    });
    
    const waitNavigationStartTime = Date.now();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    const waitNavigationEndTime = Date.now();
    
    logger.debug("Navegação após login concluída", {
      navigationTimeMs: waitNavigationEndTime - waitNavigationStartTime,
      currentUrl: page.url(),
      pageTitle: await page.title().catch(() => 'Não disponível')
    });

    // Verificar se o login foi bem-sucedido através da URL ou elemento na página
    const currentUrl = page.url();
    const loginSuccess = !currentUrl.includes('Login') && !currentUrl.includes('login');
    
    if (loginSuccess) {
      logger.info("Login na OLE realizado com sucesso", { 
        username,
        currentUrl
      });
    } else {
      logger.warn("Possível falha no login - URL contém 'login'", {
        currentUrl
      });
    }

    logger.logMethodExit('OLE.login', { 
      status: true 
    }, {
      username,
      loginSuccessful: loginSuccess,
      totalLoginTimeMs: Date.now() - navigationStartTime
    });
    
    return { status: true }; 
  } catch (error) {
    logger.logError("Erro durante login na OLE", error, { 
      username: credentials.username,
      url: page.url(),
      pageTitle: await page.title().catch(() => 'Não disponível')
    });
    
    return { status: false };
  }
}

