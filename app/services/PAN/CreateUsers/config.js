import dotenv from 'dotenv';
dotenv.config();

export const PAN_CONFIG = {
  CREATE_UNLOCK_URL:
    process.env.PAN_DESBLOQUEIO_URL,
  ERRORS: {
    USER_EXISTS: "Usuário já existe",
    INVALID_PARAMS: "Parâmetros inválidos",
    LOGIN_FAILED: "Falha na autenticação",
    CERTIFICATES_FAILED: "Erro na validação de certificados",
    NAVIGATION_FAILED: "Falha na navegação",
    USER_CREATION_FAILED: "Falha na criação do usuário"
  },
  NAVIGATION: {
    WAIT_UNTIL: "networkidle0"
  },
  VALIDATION: {
    CPF_MIN_LENGTH: 11,
    CPF_MAX_LENGTH: 14,
    CPF_REGEX: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
    CPF_CLEANED_LENGTH: 11,
    INVALID_CPFS: [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ]
  }
};