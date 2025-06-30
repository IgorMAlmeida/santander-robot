import { resetPass } from './ResetPass.js';
import dotenv from 'dotenv';
dotenv.config();
import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { sleep } from '../../../../utils.js';

export async function checkInboxEmail(page, params) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const imapDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = today.toLocaleString('en-US', { month: 'short' });
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

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

  const searchCriteria = [
    'UNSEEN',
    ['HEADER', 'FROM', `${process.env.BMG_RECOVERY_EMAIL_SENDER}`],
    ['HEADER', 'SUBJECT', `${process.env.BMG_RECOVERY_EMAIL_SUBJECT}`],
    ['SINCE', `${imapDate()}`]
  ];
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

  try {
    console.log(`Conectando ao servidor IMAP: ${config.imap.host}:${config.imap.port}`);
    await sleep(3000);
    const connection = await imap.connect(config);
    await connection.openBox('INBOX');

    console.log(`Caixa de entrada aberta. Data atual: ${imapDate()}\r\n`);
    console.log('Procurando e-mails com critérios estabelecidos. Após abertos, serao marcados como lidos.\r\n');

    const recoveryLink = await new Promise(async (resolve, reject) => {
      console.log('Iniciando contagem de tempo para busca de email...');

      const timeout = setTimeout(() => {
        reject(new Error('Timeout: E-mail de recuperação não recebido ou não encontrado dentro do período especificado.'));
      }, params.timeout || 300000);

      let emailFound = false;

      async function processMessagesSequentially(messages) {
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (emailFound) return;

          console.log(`Processando mensagem ${i + 1} de ${messages.length}`);
          const headerPart = msg.parts?.find(part => part.which === 'HEADER');
          const textPart = msg.parts?.find(part => part.which === 'TEXT');

          if (headerPart && textPart) {
            const rawEmail = [
              ...Object.entries(headerPart.body).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
              '',
              textPart.body
            ].join('\r\n');
            const parsed = await simpleParser(rawEmail);

            const emailCheck = await processRecoveryEmail(page, parsed, params);

            if (emailCheck.status && !emailCheck.keepSearching) {
              emailFound = true;
              clearTimeout(timeout);
              i = messages.length;
              return resolve(emailCheck);
            }
            if (!emailCheck.status && !emailCheck.keepSearching) {
              clearTimeout(timeout);
              i = messages.length;
              return reject(new Error(emailCheck.message));
            }
          }
        }
      }

      async function searchLoop() {
        if (emailFound) return;
        let messages;
        try {
          messages = await connection.search(searchCriteria, fetchOptions);
        } catch (err) {
          clearTimeout(timeout);
          return reject(new Error('Erro ao buscar mensagens: ' + err.message));
        }
        await processMessagesSequentially(messages);
        if (!emailFound) setTimeout(searchLoop, 1000);
      }

      searchLoop();
    });

    await connection.end();

    return {
      status: true,
      data: page,
      message: recoveryLink.message
    };
  } catch (error) {
    console.error('Error during unlocking:', error);
    return {
      status: false,
      data: error
    };
  }
}

async function isValidRecoveryEmail(parsed, params) {
  return (
    parsed.from?.text?.includes('bmgconsig@bancobmg.com.br') &&
    parsed.subject?.includes('Solicitação de nova senha BMG Consig') &&
    (
      (parsed.html?.includes(params.user) && parsed.html?.includes('BMG Consig')) ||
      (parsed.text?.includes(params.user) && parsed.text?.includes('BMG Consig'))
    )
  );
}

async function processRecoveryEmail(page, parsed, params) {
  if (await isValidRecoveryEmail(parsed, params)) {
    console.log('E-mail encontrado.');
    const link = await extractRecoveryLink(parsed.text || parsed.html);
    console.log('Link de recuperação encontrado.');

    if (link) {
      try {
        const reset = await resetPass(page, params, link);
        if (reset.status) {
          return { status: true, data: 'Reset realizado com sucesso.', message: reset.message, keepSearching: false };
        } else if (reset.data.includes('token para reiniciar a senha está desatualizado')) {
          console.log('Alteracao nao realizada, buscando novamente os emails.');
          return { status: true, data: 'Token invalido, buscar outro email.', message: reset.message , keepSearching: true };
        }
      } catch (err) {
        console.error('Erro ao resetar senha:', err);
        return { status: false, data: link, message: err.message, keepSearching: false };
      }
    }
  }

  console.log('Link incorreto, buscando novamente.');
  return { status: false, data: '', message: "E-mail de recuperação nao corresponde aos criterios de busca", keepSearching: true };
}

async function extractRecoveryLink(emailContent) {
  const urlPatterns = [
    /www\.bmgconsig\.com\.br\/ResetSenha\?[^ \n\r\t<>"]+/gi,
    /https?:\/\/[^\s]*senha[^\s]*/i,
    /https?:\/\/[^\s]*token=[^\s]*/i,
    /bmgconsig?:\/\/[^\s]*ResetSenha=[^\s]*/i
  ];

  for (const pattern of urlPatterns) {
    const match = emailContent.match(pattern);
    if (match) return match[0];
  }
  return null;
}
