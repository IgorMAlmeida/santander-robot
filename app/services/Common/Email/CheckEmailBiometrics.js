import dotenv from 'dotenv';
dotenv.config();
import imap from 'imap-simple';
const imapDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = today.toLocaleString('en-US', { month: 'short' });
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};
export async function CheckEmailBiometrics({
  email,
  emailPassword,
  emailHost,
  emailPort,
  emailSubject,
  emailSender,
  emailText,
  mailbox = 'INBOX'
}) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const config = {
    imap: {
      user: email,
      password: emailPassword,
      host: emailHost || 'imap.gmail.com',
      port: emailPort || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 10000
    }
  }

  const searchCriteria = [
    'UNSEEN',
    ['HEADER', 'FROM', `${emailSender}`],
    ['HEADER', 'SUBJECT', `${emailSubject}`],
    ['SINCE', imapDate()]
  ];

  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

  const connection = await imap.connect(config);
  await connection.openBox(mailbox);
  const messages = await connection.search(searchCriteria, fetchOptions);

  for (const msg of messages) {
    console.log("Mensgens: ", msg);
    const text = msg.parts.filter(part => part.which === 'TEXT')[0].body;
    if (text.toUpperCase().includes(emailText.toUpperCase())) {
      await connection.addFlags(msg.attributes.uid, '\\Seen');
      await connection.closeBox(false);
      return true;
    }
  }

  await connection.closeBox(false);
  return false;
};
