import logger from "../../../utils/logger.js";
import login from "../login.js";
import searchUser from "../searchUser.js";
import { blockUnnecessaryRequests } from '../../../../utils.js';
import { validateBody } from "./validation.js";
import { UserAlredyExists } from "../../../errors/UserAlredyExists.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import { initialize } from "../../Approval/InitializePuppeteer.js";
import UnlockUserQueroMais from "./UnlockUserQueroMais.js";
import resetPassQueroMais from "./resetPassUser.js";

export async function UnlockControllerQueroMais(body) {
  const validatedBody = validateBody(body);

  const { page, browser } = await initialize();
  
  try {
    await blockUnnecessaryRequests(page);

    await authenticateUser(page);
    const userData = await checkUserExists(page, validatedBody.cpf);
    const userPage = await unlockUser(page, validatedBody, userData.data.userData);
    const resetPass = await resetPassUser(userPage.data);

    console.log("User data", userData.data.userData);
    const newPass = resetPass.data;
    return {
      status: true,
      response: "Usuário desbloqueado com sucesso",
      data: {
        CPFuser: userData.data.userData[0].CPFUsuario,
        UserName: userData.data.userData[0].NomeUsuario,
        newPass
      }
    };

  } catch (error) {
    logger.logError("Erro ao criar desbloquear", {
      error: error.message,
      cpf: validatedBody.cpf,
      stack: error.stack
    });

    const isUserAlreadyExists = error instanceof UserAlredyExists;
    const isCertificateError = error instanceof CertificatesError;
    return {
      status: false,
      response: error.message,
      data: error.data || error.message,
      isUserAlreadyExists,
      isCertificateError
    };

  } finally {
    await browser.close();
  }
}


async function authenticateUser(page) {
  const { status, data } = await login(page);

  if (!status) {
    throw new Error(data);
  }

  return { status, data };
}



async function checkUserExists(page, cpf) {
  const search = await searchUser(page, cpf);
  console.log("Usuário buscado", search.status);
  console.log(search.data);

  if (!search.status) {
    throw new Error("Usuario não encontrado");
  }


  return search;
}

async function unlockUser(page, data, userData) {
  const user = await UnlockUserQueroMais(page, data, userData);

  if (!user.status) {
    throw new Error(user.data);
  }

  return user;
}

async function resetPassUser(page) {
  const reset = await resetPassQueroMais(page);

  if (!reset.status) {
    throw new Error(reset.data);
  }

  return reset;
}