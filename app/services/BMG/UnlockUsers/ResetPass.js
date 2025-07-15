import { checkElementAndText, checkElementAndValue, clickElementByXpath, sleep } from '../../../../utils.js';
import dotenv from 'dotenv';
dotenv.config();

export async function resetPass(page, params, recoveryLink) {
  let currentPassword = process.env.BMG_NEW_PASS;
  try {
    let dialogResultResolver = null;

    const dialogHandler = async dialog => {
      const message = dialog.message();
      await sleep(1000);
      if (
        message.includes('A nova senha deve ser diferente das 5 últimas alterações') ||
        message.includes('Não é permitido sequêncial numérico na composição da senha.') ||
        message.includes('invalido')
      ) {

        console.log(`Tentativa ${attempts + 1}: ${message}`);
        currentPassword = `${process.env.BMG_NEW_PASS}${Math.floor(Math.random() * 100)}`;
        console.log(`Nova senha gerada: ${currentPassword}`);

        await dialog.dismiss();
        return dialogResultResolver?.({ shouldRetry: true, passwordAccepted: false });
      }
      await dialog.accept();
      return dialogResultResolver?.({ shouldRetry: false, passwordAccepted: true });
    };

    console.log('Conexão IMAP encerrada. Iniciando processo de reset de senha...');

    const completeURL = recoveryLink.startsWith('http') ? recoveryLink : `https://${recoveryLink}`;
    console.log('Redirecionando para aleração de senha:', completeURL);
    await page.goto(completeURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await sleep(1000);
    console.log('Verificando se o token é válido...');
    let checkIfIsValidToken = await checkElementAndText(page, '/html/body/table[1]/tbody/tr/td')
    if (checkIfIsValidToken.status && checkIfIsValidToken.text.includes('O token para reiniciar a senha está desatualizado. Contate o administrador.')) {
      throw new Error(checkIfIsValidToken.text);
    }

    console.log('Token valido. Verificando se o usuario corresponde com o email...');
    const userToReset = await checkElementAndValue(page, '//*[@id="userName"]');
    if (!userToReset.status) {
      throw new Error(userToReset.text);
    }
    if (!userToReset.text.includes(params.user)) {
      throw new Error("Usuario de reset diferente do enviado para email.");
    }

    console.log('Usuário corresponde com o email enviado. Iniciando redefinição de senha...');
    let passwordAccepted = false;
    let attempts = 1;

    page.removeAllListeners('dialog');
    page.on('dialog', async dialog => {
      await dialogHandler(dialog);
    });

    console.log('Preenchendo novas senhas...');
    while (attempts <= 4 && !passwordAccepted) {
      try {
        console.log(`Tentativa ${attempts + 1} - Digitando senha: ${currentPassword}`);
        await clearPasswordFields();
        await page.type('#newPassword', currentPassword, { delay: 50 });
        await page.type('#confirmPassword', currentPassword, { delay: 50 });
        await sleep(500);

        console.log('Clicando no botão de redefinir senha...');
        await clickElementByXpath(page, '//*[@id="bt-login"]');
        await sleep(1000);

        const dialogResult = Promise.race([
          new Promise(resolve => {
            dialogResultResolver = resolve;
          }),
          new Promise(resolve => setTimeout(() => {
            console.warn('Nenhum diálogo apareceu. Continuando...');
            resolve({ shouldRetry: false, passwordAccepted: true });
          }, 3000))
        ]);

        const result = await dialogResult;
        passwordAccepted = result.passwordAccepted;

        console.log('Resultado do diálogo:', result);
        if (result.shouldRetry) {
          console.log('Recarregando página...');
          await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(500);
          await clearPasswordFields();
          continue;
        }

        console.log('Attemps:', attempts);
        await sleep(1000);
        await clickElementByXpath(page, '//*[@id="form-redirect"]/table[2]/tbody/tr/td/a/span');
      } catch (error) {
        console.log('Erro durante tentativa:', error.message);
        throw new Error("Ocorreu um erro ao resetar a senha: " + error.message);
      } finally {
        console.log('Caiu no finally');
        attempts++;
        dialogResultResolver = null;
      }
    }

    page.off('dialog', dialogHandler);

    if (!passwordAccepted) {
      throw new Error('Não foi possível definir uma nova senha após 3 tentativas');
    }

    console.log('Senha redefinida com sucesso. Retornando:', currentPassword);
    return {
      status: true,
      data: {
        page,
        user:params.user,
        pass:currentPassword
      },
      message: 'Senha redefinida com sucesso.'
    };
  } catch (error) {
    console.error('Error during resetting password:', error);
    return {
      status: false,
      data: error.message,
      message: 'Erro ao resetar senha do usuário.'
    };
  }

  async function clearPasswordFields() {
    await page.evaluate(() => {
      const newPassInput = document.getElementById('newPassword');
      const confirmPassInput = document.getElementById('confirmPassword');

      if (newPassInput) {
        newPassInput.value = '';
        newPassInput.dispatchEvent(new Event('input', { bubbles: true }));
        newPassInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (confirmPassInput) {
        confirmPassInput.value = '';
        confirmPassInput.dispatchEvent(new Event('input', { bubbles: true }));
        confirmPassInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    console.log('Campos de senha limpos');
  }
}