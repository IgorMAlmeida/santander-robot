import { clickElementByXpath, sleep, getElementText, checkElement, getElementTextByXpath, replaceValues } from "../../utils.js";

export async function scrappingOlaConsult(targetPage) {
    try {
        let response = ""
        await targetPage.waitForNavigation({ waitUntil: 'load' });
    
        let usuarioDigitador = await getElementTextByXpath(targetPage, '//*[@id="panel-5"]/div[17]/p');
        const match = usuarioDigitador.match(/Usuário: (\w+)/);
        
        if (match) {
            response = match[1];
        }
        
        return { status: true, data: response };
    } catch (error) {
        console.error('Error in scrappingOlaConsult:', error);
        return { status: false, data: 'Error in scrappingOlaConsult: ' + error };
    }
}
