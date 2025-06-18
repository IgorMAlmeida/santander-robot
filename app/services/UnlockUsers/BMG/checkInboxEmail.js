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

  try {
    console.log(`Conectando ao servidor IMAP: ${config.imap.host}:${config.imap.port}`);
    const connection = await imap.connect(config);
    await connection.openBox('INBOX');
    const imapDate = () => {
      const today = new Date();
      const day = String(today.getDate() -1).padStart(2, '0');
      // const day = String(today.getDate()).padStart(2, '0');
      const month = today.toLocaleString('en-US', { month: 'short' });
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    }

    console.log(`Caixa de entrada aberta. Data atual: ${imapDate()}`);
    console.log('Conexão IMAP estabelecida e caixa de entrada aberta.');
    const searchCriteria = [
      // 'UNSEEN',
      ['HEADER', 'FROM', `${process.env.BMG_RECOVERY_EMAIL_SENDER}`],
      ['HEADER', 'SUBJECT', `${process.env.BMG_RECOVERY_EMAIL_SUBJECT}`],
      // ['TEXT', params.user],
      ['SINCE', `${imapDate()}`]
    ];

    console.log('Procurando e-mails com critérios:', searchCriteria);
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };

    const recoveryLink = await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: E-mail de recuperação não recebido'));
      }, params.timeout || 300000);
      
      console.log('Iniciando busca por e-mails...');
      try {
        const interval = setInterval(async () => {
          console.log('Busca iniciada...');

          const messages = await connection.search(searchCriteria, fetchOptions);

          console.log(`Encontrados ${messages} e-mails correspondentes.`);
          for (const msg of messages) {
            const all = msg.parts.map(part => part.body).join('\n');
            const parsed = await simpleParser(all);
            console.log('==============================');
            console.log('Mensagem:', msg);
            console.log('Parsed:', parsed);
            console.log('De:', parsed.from?.text);
            console.log('Data:', parsed.date);
            console.log('Mensagem ID:', parsed.messageId);
            console.log('Corpo:', parsed.text || parsed.html);

            if (
              parsed.from?.text?.includes('bmgconsig@bancobmg.com.br') &&
              parsed.subject?.includes('Solicitação de nova senha BMG Consig') &&
              parsed.text?.includes(params.user)
            ) {
              clearInterval(interval);
              clearTimeout(timeout);

              const link = await extractRecoveryLink(parsed.text || parsed.html);
              console.log('Link de recuperação encontrado:', link);
              if (link) return resolve(link);
              return reject(new Error('Link de recuperação não encontrado no e-mail'));
            }
          }
          console.log('Nada encontrado...');

        }, 1000);
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

  async function extractRecoveryLink(emailContent) {
    const urlPatterns = [
      /https?:\/\/[^\s]*recovery[^\s]*/i,
      /https?:\/\/[^\s]*reset[^\s]*/i,
      /https?:\/\/[^\s]*senha[^\s]*/i,
      /https?:\/\/[^\s]*token=[^\s]*/i,
      /bmgconsig?:\/\/[^\s]*ResetSenha=[^\s]*/i,
      /https?:\/\/[^\s<>"']+/gi,
      /www\.bmgconsig\.com\.br\/ResetSenha\?[^ \n\r\t<>"]+/gi
    ];

    for (const pattern of urlPatterns) {
      const match = emailContent.match(pattern);
      if (match) return match[0];
    }
    return null;
  }

}