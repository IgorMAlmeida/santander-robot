import { clickElementByXpath, sleep } from "../../utils.js";

export async function getProposalByCpf(page, cpf, codProposal, date) {
    try {
        await page.reload({ waitUntil: 'domcontentloaded' });
        const cpfFormatted = cpf[cpf.length - 1] + cpf.slice(0, 10);
        const dateFormatted = date[date.length - 1] + date.slice(0, 9);

        await page.type('::-p-xpath(//*[@id="CPF"])', cpfFormatted, { delay: 10 });
        await page.type('::-p-xpath(//*[@id="DataInicial"])', dateFormatted, { delay: 40 });
        await page.type('::-p-xpath(//*[@id="DataFinal"])', dateFormatted, { delay: 40 });
        await clickElementByXpath(page, '//*[@id="btnPesquisar"]');

        await sleep(2500);
        const trElement = await page.evaluate((content) => {
            const td = Array.from(document.querySelectorAll('td')).find(td => td.textContent.trim() === content);
            if (td) {
                const tr = td.closest('tr');
                const child = tr.children[6];
                return child ? child.textContent : null;
            }
            return null;
        }, codProposal);

        if(!trElement) {
            throw new Error('Proposta não encontrada');
        }

        return {
          status: true,
          data: trElement.replace(/[\s\n]/g, '')
        }
    } catch (error) {
        return { 
          status: false, 
          data: error
        };
    }
}