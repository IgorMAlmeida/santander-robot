import { getElementTextByXpath } from "../../utils.js";

export async function scrappingOlaConsult(targetPage) {
    try {
        let usuarioDigitador = await getElementTextByXpath(targetPage, '//*[@id="tabelaDePropostas"]/tbody/tr/td[7]');
        
        usuarioDigitador = usuarioDigitador.replace(/[\s\n]/g, '');
        return { status: true, data: usuarioDigitador };
    } catch (error) {
        console.error('Error in scrappingOlaConsult:', error);
        return { status: false, data: 'Error in scrappingOlaConsult: ' + error };
    }
}
