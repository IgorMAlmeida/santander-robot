export async function isValidRecoveryEmail(parsed, params) {
  console.log("================PARSED==================");
  console.log(parsed.from?.text);
  console.log(parsed.subject);
  console.log(parsed.html);
  console.log(parsed.text);
  console.log("================params==================");
  console.log(params);
    
    return (
        parsed.from?.text?.includes(params.emailSender) &&
        parsed.subject?.includes(params.emailSubject) &&
        (
            (parsed.html?.includes(params.user) && parsed.html?.includes(params.emailBankText)) ||
            (parsed.text?.includes(params.user) && parsed.text?.includes(params.emailBankText))
        )
    );
} 