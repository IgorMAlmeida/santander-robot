export async function isValidRecoveryEmail(parsed, params) {
    return (
        parsed.from?.text?.includes(params.emailSender) &&
        parsed.subject?.includes(params.emailSubject) &&
        (
            (parsed.html?.includes(params.user) && parsed.html?.includes(params.emailBankText)) ||
            (parsed.text?.includes(params.user) && parsed.text?.includes(params.emailBankText))
        )
    );
} 