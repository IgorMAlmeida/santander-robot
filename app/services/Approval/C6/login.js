import { clickElementByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
import logger from "../../../utils/logger.js";

dotenv.config();

/**
 * Realiza login no sistema de aprovação do C6
 */
export async function login(page, credentials) {
  logger.logMethodEntry('C6.login', { 
    username: credentials.username,
    bankName: 'C6'
  });
  
  try {
    const url = process.env.C6_APROVACAO_URL;
    logger.debug("URL de login do C6", { url });

    const username = credentials.username;
    logger.debug("Tentativa de login", { 
      username,
      bankName: 'C6'
    });
    
    logger.debug("Navegando para a página de login do C6", {
      url,
      waitUntil: 'networkidle0'
    });
    
    const navigationStartTime = Date.now();
    await page.goto(url, { waitUntil: "networkidle0" });
    const navigationEndTime = Date.now();
    
    logger.debug("Navegação para página de login concluída", {
      url,
      navigationTimeMs: navigationEndTime - navigationStartTime,
      pageTitle: await page.title().catch(() => 'Não disponível')
    });

    logger.debug("Extraindo FISession da URL");
    const extractStartTime = Date.now();
    const FISession = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('FISession');
    });
    const extractEndTime = Date.now();
    
    logger.debug("FISession extraída com sucesso", { 
      FISession,
      extractionTimeMs: extractEndTime - extractStartTime,
      sessionLength: FISession ? FISession.length : 0
    });

    logger.debug("Digitando nome de usuário", {
      selector: '::-p-xpath(//*[@id="EUsuario_CAMPO"])',
      username
    });
    await page.type('::-p-xpath(//*[@id="EUsuario_CAMPO"])', username);

    logger.debug("Digitando senha");
    const password = credentials.password;
    await page.type('::-p-xpath(//*[@id="ESenha_CAMPO"])', password);
    
    logger.debug("Clicando no botão de login", {
      xpath: '//*[@id="lnkEntrar"]'
    });
    await clickElementByXpath(page,'//*[@id="lnkEntrar"]');

    // Configurar handler para diálogos antes da navegação
    page.on('dialog', async dialog => {
      const dialogMessage = dialog.message();
      logger.debug(`Diálogo detectado durante login`, {
        dialogType: dialog.type(),
        dialogMessage
      });
      await dialog.accept();
      logger.debug(`Diálogo aceito automaticamente`);
    });
  
    logger.debug("Aguardando navegação após login", {
      waitUntil: 'networkidle0'
    });
    
    const waitNavigationStartTime = Date.now();
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    const waitNavigationEndTime = Date.now();
    
    logger.debug("Navegação após login concluída", {
      navigationTimeMs: waitNavigationEndTime - waitNavigationStartTime,
      currentUrl: page.url()
    });

    const approvalUrl = `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaAnd.aspx?FISession=${FISession}`;
    
    logger.debug("Navegando para página de consulta de aprovação", {
      url: approvalUrl,
      waitUntil: 'networkidle0'
    });
    
    const approvalNavStartTime = Date.now();
    await page.goto(approvalUrl, { waitUntil: "networkidle0" });
    const approvalNavEndTime = Date.now();
    
    logger.debug("Navegação para página de aprovação concluída", {
      navigationTimeMs: approvalNavEndTime - approvalNavStartTime,
      pageTitle: await page.title().catch(() => 'Não disponível'),
      currentUrl: page.url()
    });

    logger.logMethodExit('C6.login', { 
      status: true, 
      data: FISession 
    }, {
      username,
      loginSuccessful: true,
      sessionObtained: !!FISession
    });
    
    return {
      status: true,
      data: FISession
    }; 
  } catch (error) {
    logger.logError("Erro durante login no C6", error, { 
      username: credentials.username,
      url: page.url(),
      pageTitle: await page.title().catch(() => 'Não disponível')
    });
    
    return {
      status: false,
      data: error.message
    };
  }
}

