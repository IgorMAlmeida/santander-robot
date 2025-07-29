import dotenv from 'dotenv';
dotenv.config();

export const PAN_UNLOCK_CONFIG = {
  SELECTORS: {
    PAN_PARTNER: process.env.PAN_PARTNER,
    STORE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbLoja_CAMPO"]',
    CHANGE_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios_ctl02_ctl00"]',
    STATUS_CHANGE_FIELD: '#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbStatus_CAMPO',
    STATUS_CHANGE_OPTION_FIELD: 'Ativo',
    ORIGIN_RIGHT_FIELD: '//*[@id="btnOrigens_txt"]',
    ORIGIN_RIGHT_SAVE_FIELD: '//*[@id="btnGravar_txt"]',
    CONFIRM_BUTTON_FIELD: '//*[@id="btnConfirmar_txt"]',
    GOBACK_BUTTON_FIELD: '//*[@id="btnVoltar_txt"]',
    GOBACK_LOGIN_DATA_BUTTON_FIELD: '//*[@id="ctl00_cph_FIJN1_jnDadosLogin_ucBotao_btnVoltar_dvTxt"]/table/tbody/tr/td',
    RESET_PASS_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios"]/tbody/tr[2]/td[9]/input',
    RESET_PASS_CONFIRM_FIELD: '//*[@id="ctl00_cph_FIJN1_jnDadosLogin_lblMensagem"]',
    RESET_PASS_YES_FIELD: '//*[@id="btnOpTrue_txt"]',
    NEW_PASS_YES_FIELD: '//*[@id="ctl00_cph_FIJN1_jnDadosLogin_txtSenha_CAMPO"]',
    DOCUMENTATION_STATUS_FIELD: '//*[@id="ctl00_Cph_FIJN1_jnVincEmp_ucVincEmp_lblSitVinculo"]',
  },
  URL:{
    PASS_CONFIRM:'https://panconsig.pansolucoes.com.br/WebAcesso/MenuWeb/Cadastros/Usuarios/UI.ConfirmacaoCadastroUsuarioPopUp.aspx?UpdPan=ctl00_Cph_popConfirmacao_updP&ns=Pop_ManutencaoUsuario&frame=ctl00_Cph_popConfirmacao_frameAjuda&idPback=&FISession=',
  }
}