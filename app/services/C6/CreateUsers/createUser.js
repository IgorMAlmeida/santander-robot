import { selectOptionByXpath, pasteValueByXpath, typeByXpath, sleep } from "../../../../utils.js";
import logger from "../../../utils/logger.js";

export async function createUser(page, body) {
    try {
      await firstStep(page, body);
      await secondStep(page, body);
    } catch (error) {
        logger.logError("Erro ao criar usuário", error);
        throw error;
    }
}

async function firstStep(page, body) {
    try {
        const { cpf, name } = body;

        await typeByXpath(
          page,
          '//*[@id="ctl00_Cph_FIJN1_jnInserir_txtCpf_CAMPO"]',
          cpf
        );
        await pasteValueByXpath(
          page,
          '//*[@id="ctl00_Cph_FIJN1_jnInserir_txtNomeUsu_CAMPO"]',
          name
        );

        await selectOptionByXpath(
          page,
          "#ctl00_Cph_FIJN1_jnInserir_cmbOrigem3_CAMPO",
          "000012"
        );

        await page.evaluate(() => {
          const input = document.querySelector(
            "#ctl00_Cph_FIJN1_jnInserir_txtCpf_CAMPO"
          );
          input.click();
        });

        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
    } catch (error) {
        logger.logError("Erro ao criar usuário", error);
        throw error;
    }
}

async function secondStep(page, body) {
    try {
        const { email, phone, birth_date, mothers_name} = body;

        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtEmail_CAMPO"]', email);
        await typeByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDtNasc_CAMPO"]', birth_date);
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNro_CAMPO"]', "1120");
        await sleep(500);
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDDDCel_CAMPO"]', phone.slice(0, 2));
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCel_CAMPO"]', phone.slice(2));
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDDDTelRec_CAMPO"]', phone.slice(0, 2));
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtTelRec_CAMPO"]', phone.slice(2));
        await pasteValueByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtMae_CAMPO"]', mothers_name);
    } catch (error) {
        logger.logError("Erro ao criar usuário", error);
        throw error;
    }
}