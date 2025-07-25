import { clickElementByXpath, sleep, checkElementAndText, getUsersTablePan, typeByXpath, } from "../../../utils.js";
import logger from "../../utils/logger.js";

export default async function searchUser(page, cpf) {
  try {
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await clickElementByXpath(page, '//*[@id="block"]/a');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await clickElementByXpath(page, '//*[@id="WFP2010_MPMNUSUAUT"]');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await typeByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_txtCampoPesq_CAMPO"]', cpf);
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');
    await sleep(2000);

    logger.debug("Buscando usuário com CPF:", cpf);
    const isTableEmpty = await checkElementAndText(page, '//*[@id="ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios"]/tbody/tr[2]/td');
    console.log(isTableEmpty);
    logger.debug("Verificando se tabela é vazia", isTableEmpty);
    if (isTableEmpty.status && isTableEmpty.text.includes('Nenhum Usuário para visualização')) {
      throw new Error('Usuario não encontrado');
    }

    await sleep(1000);
    logger.debug("Tabela não vazia.");
    const userData = await getUsersTablePan(page, '//*[@id="ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios"]');

    return {
      status: true,
      data: { page, userData  },
      message: 'User found!'
    };
  } catch (error) {
    console.error('Error during searching user:', error);
    return {
      status: false,
      data: error,
      message: 'Error during searching user'
    };
  }
}