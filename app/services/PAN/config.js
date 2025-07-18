export const PAN_LOGIN_CONFIG = {
  SELECTORS: {
    USERNAME_FIELD: '//*[@id="cpf-input"]/label/span[2]/input',
    LOGIN_BUTTON: '//*[@id="username"]',
    NECESSARY_BIOMETRICS: "Para continuar o login no seu computador"
  },
  NAVIGATION: {
    WAIT_UNTIL: "networkidle0",
  },
//   SESSION_PARAM: "FISession",
  ERRORS: {
    BIOMETRICS_NECESSARY: "Biometria necessária",
    INVALID_PAGE: "Página não fornecida",
    MISSING_CREDENTIALS: "Credenciais não configuradas",
    INVALID_URL: "URL inválida",
    LOGIN_FAILED: "Falha na autenticação",
  },
};
