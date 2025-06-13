import { getElementTextByXpath, sleep } from "../../../../utils.js";
import justNumbers from "../../../utils/justNumbers.js";
import logger from "../../../utils/logger.js";

export const getCodeAgent = async (page) => {
    await sleep(2000);

    const codeAgent = await getElementTextByXpath(
        page,
        '//*[@id="corpo"]/header/div/div/div/div[2]/span'
    );
    const codeAgentText = justNumbers(codeAgent);

    logger.debug("Código do agente recuperado", { codeAgent: codeAgentText });

    if (!codeAgentText) {
        logger.warn("Código do agente não encontrado", {
            originalText: codeAgent,
        });
        throw new Error("Código do agente não encontrado");
    }

    return codeAgentText;
}