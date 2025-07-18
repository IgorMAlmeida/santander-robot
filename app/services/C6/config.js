export const C6_LOGIN_CONFIG = {
  SELECTORS: {
    USERNAME_FIELD: '//*[@id="EUsuario_CAMPO"]',
    PASSWORD_FIELD: '//*[@id="ESenha_CAMPO"]',
    LOGIN_BUTTON: '//*[@id="lnkEntrar"]',
  },
  NAVIGATION: {
    WAIT_UNTIL: "networkidle0",
  },
  SESSION_PARAM: "FISession",
  ERRORS: {
    INVALID_PAGE: "Página não fornecida",
    MISSING_CREDENTIALS: "Credenciais não configuradas",
    INVALID_URL: "URL inválida",
    LOGIN_FAILED: "Falha na autenticação",
  },
};
