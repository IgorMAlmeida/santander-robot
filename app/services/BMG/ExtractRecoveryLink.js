export async function ExtractRecoveryLink(emailContent) {
  console.log("Email content: ", emailContent);
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
