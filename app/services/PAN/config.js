export const PAN_LOGIN_CONFIG = {
  SELECTORS: {
    USERNAME_FIELD: '//*[@id="cpf-input"]/label/span[2]/input',
    LOGIN_BUTTON: '//*[@id="username"]',
    USER_AND_STORE_FIELD: '//*[@id="username"]',
    USER_AND_STORE_BUTTON_FIELD:'//*[@id="kc-login"]',
    USER_PASS_FIELD: '//*[@id="password"]',
    NECESSARY_BIOMETRICS: "Para continuar o login no seu computador",
    URL_BIOMETRICS_FIELD: '//*[@id="biometria"]/p',
    BIOMETRICS_SEND_FIELD: '//*[@id="enviar-biometria"]',
    BIOMETRICS_ERROR_FIELD: '//*[@id="erros"]/p[2]',
  },
  NAVIGATION: {
    WAIT_UNTIL: "networkidle0",
  },
  ERRORS: {
    BIOMETRICS_NECESSARY: "Biometria necessária",
    INVALID_PAGE: "Página não fornecida",
    MISSING_CREDENTIALS: "Credenciais não configuradas",
    INVALID_URL: "URL inválida",
    LOGIN_FAILED: "Falha na autenticação",
  },
};
