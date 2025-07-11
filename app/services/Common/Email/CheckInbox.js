import dotenv from 'dotenv';
dotenv.config();
import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { sleep } from '../../../../utils.js';
import { ProcessResetPass } from '../../BMG/ProcessResetPass.js';

const processResetPass = {
  BMG: (page, parsed, params) => ProcessResetPass(page, parsed, params),
}
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};
export async function CheckInbox(page, params) {
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
      user: params.email,
      password: params.emailPassword,
      host: params.emailHost || 'imap.gmail.com',
      port: params.emailPort || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 10000
    }
  };

  const searchCriteria = [
    'UNSEEN',
    ['HEADER', 'FROM', `${params.emailSender}`],
    ['HEADER', 'SUBJECT', `${params.emailSubject}`],
    ['SINCE', imapDate()]
  ];
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };

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
      let processedUIDs = new Set();

      async function processMessagesSequentially(messages) {
        console.log(`${colors.green}Mensagem recebida${colors.reset}`,messages);
        const newMessages = messages.filter(msg => !processedUIDs.has(msg.attributes.uid));
        
        if (newMessages.length === 0) {
          console.log('Nenhuma mensagem nova para processar');
          clearTimeout(timeout);
          return reject(new Error('Nenhuma mensagem nova para processar'));
        }

        for (let i = 0; i < newMessages.length; i++) {
          console.log(`${colors.green}Mensagem [${i}] dentro do form${colors.reset}`, newMessages[i].attributes.uid);
          const msg = newMessages[i];
          if (emailFound) return;

          console.log(`Processando mensagem ${i + 1} de ${newMessages.length} (UID: ${msg.uid})`);
          processedUIDs.add(msg.attributes.uid);
          console.log(`Processando mensagem ${i + 1} de ${newMessages.length}`);
          const headerPart = msg.parts?.find(part => part.which === 'HEADER');
          const textPart = msg.parts?.find(part => part.which === 'TEXT');

          if (headerPart && textPart) {
            const rawEmail = [
              ...Object.entries(headerPart.body).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
              '',
              textPart.body
            ].join('\r\n');
            const parsed = await simpleParser(rawEmail);

            //Define qual funcao vai ser utilizada para validar email de senha a depender do banco;
            const bankName = String(params.bank).toUpperCase();
            const processFunction = processResetPass[bankName]
            console.log("Função de desbloqueio encontrada para o banco: ", processFunction);
            let emailCheck;
            if (typeof processFunction === 'function') {
              try {
                console.log("Processamento iniciado");
                emailCheck = await processFunction(page, parsed, params);
                console.log("Apos ler email e tentar reset.");
                console.log(emailCheck)
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
              } catch (error) {
                console.error(`Erro ao executar a função de desbloqueio para o banco ${bankName}:`, error.message);
                return reject(new Error(`${error}`));
              }
            } else {
              console.warn(`Nenhuma estratégia de desbloqueio definida para o banco: ${params.bank} (Normalizado: ${bankName})`);
              return reject(new Error(`Nenhuma estratégia de desbloqueio definida para o banco: ${params.bank} (Normalizado: ${bankName})`));
            }

            console.log();
          }
        }
        clearTimeout(timeout);
        return reject(new Error(`Todas mensagens foram lidas, e nao foi encontrado email com link para redefinicao de senha.`));
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

        console.log(`Mensagens encontradas: ${messages.length}`);
        if (messages.length > 0) {
          return await processMessagesSequentially(messages);
        }
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




