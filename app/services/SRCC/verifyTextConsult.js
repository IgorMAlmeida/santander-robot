import { getElementTextByXpath } from "../../../utils.js";

export async function verifyTextConsult(page) {
  try {
    const text = await getElementTextByXpath(page, '//*[@id="MensagemRetornoConsultaSrccInformativa"]/b');

    if(!text || text.includes("não foi identificado nenhum registro até o momento")) {
        throw new Error("Registro não encontrado")
    }

    return { 
      status: true, 
      data: "Registro encontrado"
    }
  }catch (error) {
    return { 
      status: false, 
      data: error
    };
  }
}