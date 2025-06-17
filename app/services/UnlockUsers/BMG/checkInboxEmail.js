import { checkElementAndText, clickElementByXpath, sleep } from '../../../../utils.js';

import dotenv from 'dotenv';
dotenv.config();
import imap from 'imap-simple';
import { simpleParser } from 'mailparser'; 


export async function checkInboxEmail(page, params) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const config = {
    imap: {
      user: process.env.EMAIL_SUPORTE_LOGIN,
      password: process.env.PASS_SUPORTE_LOGIN,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 10000
    }
  };

  console.log(config)
 

  try {
    console.log(`Conectando ao servidor IMAP: ${config.imap.host}:${config.imap.port}`);
    const connection = await imap.connect(config);
    await connection.openBox('INBOX');

    console.log('Conexão IMAP estabelecida e caixa de entrada aberta.');
    const searchCriteria = [
      // 'UNSEEN',
      ['FROM', process.env.BMG_RECOVERY_EMAIL_SENDER],
      ['SUBJECT', `${process.env.BMG_RECOVERY_EMAIL_SUBJECT}`]
      // ['FROM','todomundo@nubank.com.br'],
      // ['SUBJECT', `Seu limite adicional será reduzido`]
    ];

    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    const recoveryLink = await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: E-mail de recuperação não recebido'));
      }, params.timeout || 300000);
      
      try {
        const interval = setInterval(async () => {
          const messages = await connection.search(searchCriteria, fetchOptions);
          console.log('Conexão Mensagens.',messages);
          
          if (messages.length > 0) {
            clearInterval(interval);
            clearTimeout(timeout);
            
            const parsed = await simpleParser(messages[0].parts[0].body);
            const link = extractRecoveryLink(parsed.text || parsed.html);
            
            if (link) {
              resolve(link);
            } else {
              reject(new Error('Link de recuperação não encontrado no e-mail'));
            }
          }
        }, 15000);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
    
    await connection.end();

    await page.goto(recoveryLink, { waitUntil: 'networkidle2', timeout: 30000 });
    const userToReset = await checkElementAndText(page, '//*[@id="userName"]');
    if(!userToReset.status){
      throw new Error(userToReset.data);
    }
    if(!userToReset.includes(params.user)){
      throw new Error("Usuario de reset diferente do enviado para email.");
    }

    await page.type('::-p-xpath(//*[@id="newPassword"])', process.env.BMG_NEW_PASS, { delay: 100 });
    await page.type('::-p-xpath(//*[@id="confirmPassword"])', process.env.BMG_NEW_PASS, { delay: 100 });
    await clickElementByXpath(page, '//*[@id="bt-login"]');

    await sleep(1000);
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

  function extractRecoveryLink(emailContent) {
    const urlPatterns = [
      /https?:\/\/[^\s]*recovery[^\s]*/i,
      /https?:\/\/[^\s]*reset[^\s]*/i,
      /https?:\/\/[^\s]*senha[^\s]*/i,
      /https?:\/\/[^\s]*token=[^\s]*/i
    ];

    for (const pattern of urlPatterns) {
      const match = emailContent.match(pattern);
      if (match) return match[0];
    }
    return null;
  }

}