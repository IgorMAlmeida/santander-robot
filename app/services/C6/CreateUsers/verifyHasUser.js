import { clickElementByXpath, getElementTextByXpath, sleep, typeByXpath } from "../../../../utils.js";

export async function verifyHasUser(page, cpf) {
    await typeByXpath(page, '//*[@id="ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_txtCampoPesq_CAMPO"]', cpf);
    await clickElementByXpath(page, '//*[@id="btnPesquisar_txt"]');
    
    await sleep(2000);

    const text = await getElementTextByXpath(
      page,
      '//*[@id="ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios"]/tbody/tr[2]/td'
    );


    if(text === 'Nenhum Usuário para visualização.') {
        return false;
    }

    return true;
}