import { isValidRecoveryEmail } from "../../helpers/isValidRecoveyEmail.js";
import { ExtractRecoveryLink } from "./ExtractRecoveryLink.js";
import { resetPass } from "./UnlockUsers/ResetPass.js";

export async function ProcessResetPass(page, parsed, params) {
  console.log('===================================================');
  // console.log('Entrou na funcao. Verificando se é valido o link');
  if (await isValidRecoveryEmail(parsed, params)) {
    console.log('E-mail encontrado.');
    const link = await ExtractRecoveryLink(parsed.text || parsed.html);
    console.log('Link de recuperação encontrado.');

    if (link) {
      try {
        const reset = await resetPass(page, params, link);
        if (reset.status) {
          return { status: true, data: reset.data, message: reset.message, keepSearching: false };
        } else if (reset.data.includes('token para reiniciar a senha está desatualizado')) {
          console.log('Alteracao nao realizada, buscando novamente os emails.');
          return { status: true, data: reset.data, message: reset.message , keepSearching: true };
        }
      } catch (err) {
        console.error('Erro ao resetar senha:', err);
        return { status: false, data: link, message: err.message, keepSearching: false };
      }
    }
  }
  console.log('===================================================');

  console.log('Link incorreto, buscando novamente.');
  return { status: false, data: '', message: "E-mail de recuperação nao corresponde aos criterios de busca", keepSearching: true };
}