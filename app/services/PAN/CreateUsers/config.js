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

export const PAN_CREATE_CONFIG = {
  SELECTORS: {
    CPF_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCpf_CAMPO"]',
    NAME_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNomeUsu_CAMPO"]',
    EMAIL_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtEmail_CAMPO"]',
    BIRTH_DATE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDtNasc_CAMPO"]',
    CEP_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCep_CAMPO"]',
    ADDRESS_NUMBER_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNro_CAMPO"]',
    DDD_CELPHONE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDDDCel_CAMPO"]',
    CELPHONE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCel_CAMPO"]',
    DDD_PHONE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDDDTelRec_CAMPO"]',
    PHONE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtTelRec_CAMPO"]',
    MOTHERS_NAME_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtMae_CAMPO"]',
    PROFILE_SELECTOR_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbGrupoAcesso1_CAMPO"]',
    PROFILE_SELECTOR_FIELD_ID: '#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbGrupoAcesso1_CAMPO',
    PROFILE_VALUE_FIELD: '48692',
    RESTRICT_PROFILE_SELECTOR_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbUsuRestrito_CAMPO"]',
    RESTRICT_PROFILE_SELECTOR_FIELD_ID: '#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbUsuRestrito_CAMPO',
    RESTRICT_PROFILE_VALUE_FIELD: 'S',
    MASTER_PROMOTER_SELECTOR_FIELD: '//*[@id="ctl00_PROFILE_VALUE_FIELDCph_FIJN1_jnDadosLogin_UcDUsu_cmbOrigem3_CAMPO"]',
    MASTER_PROMOTER_SELECTOR_FIELD_ID: '#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbOrigem3_CAMPO',
    MASTER_PROMOTER_VALUE_FIELD: '003419',
    CONTRACT_TYPE_SELECTOR_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_cmbRegContratacao_CAMPO"]',
    CONTRACT_TYPE_SELECTOR_FIELD_ID: '#ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_cmbRegContratacao_CAMPO',
    CONTRACT_TYPE_VALUE_FIELD: '4',
    CONTRACT_INPUT_SELECTOR_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_upFile"]',
    CONTRACT_TYPE_UPLOAD_FIELD: '//*[@id="btnUploadArquivo_txt"]',
    DOCUMENT_SELECTOR_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_cmbTipoDocIdentificacao_CAMPO"]',
    DOCUMENT_SELECTOR_FIELD_ID: '#ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_cmbTipoDocIdentificacao_CAMPO',
    DOCUMENT_VALUE_RG_FIELD: '1',
    DOCUMENT_VALUE_CNH_FIELD: '2',
    DOCUMENT_INPUT_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_upFileDocIdent"]',
    DOCUMENT_UPLOAD_FIELD: '//*[@id="btnUploadArqDocIdent_txt"]',
    CONFIRM_BUTTON_FIELD: '//*[@id="btnConfirmar_txt"]',
    PASS_FIELD: '//*[@id="ctl00_cph_FIJN1_jnDadosLogin_txtSenha_CAMPO"]',
  },
  NAVIGATION: {
    // WAIT_UNTIL: "networkidle0",
  },
  ERRORS: {
    PASS_FIELD_NOT_FOUND: "Campo de senha não encontrado",
    INPUT_FILE_NOT_FOUND: "Input file para documento não encontrado",
  },
}