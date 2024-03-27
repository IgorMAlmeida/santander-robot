import { clickElementByXpath } from "../../utils.js";

export async function scrappingProposalData(targetPage, data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    await clickElementByXpath(targetPage, `//*[@id="ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBSit"]`);

    data.situacao = await getElementText(targetPage, '#ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBSit');
    data.proximaAtividade = await getElementText(targetPage, '#ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBDesc');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    const liquidValue = await getLiquidValue(targetPage);

    const pendencies = getPending(data.situacao);

    await targetPage.waitForSelector('::-p-xpath(//*[@id="ctl00_cph_j0_j1_UpdatePanel1"]/table/tbody/tr[1]/td[2]/table[1]/tbody/tr/td/table/tbody)');

    data.codProposta = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblNumeroDaProposta');
    data.cpf = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblCpf');
    data.nomeCliente = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblCliente');
    data.dataBase = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblDataBase');
    data.produto = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblProduto');
    data.status = `${data.situacao} - ${data.proximaAtividade}`;
    data.valorLiquido = liquidValue;
    data.valorParcela = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblValorParcela');
    data.valorBruto = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblValorSolicitado');
    data.propostaAverbada = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblValorSolicitado');
    data.valorSeguro = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblSeguro');
    data.dataPrimeiroVencimento = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblVcto1Parcela');
    data.pendencias = pendencies;

    targetPage.close();
    return data;
}

async function getLiquidValue(targetPage) {
    const trElements = await targetPage.$$eval('table#ctl00_cph_j0_j1_UcLib3_GRLIB tbody tr', rows => Array.from(rows, row => row.innerHTML));
    for (const trContent of trElements) {
        if (trContent.includes('LIB CONTA CORRENTE') || trContent.includes('LIB TED') || trContent.includes('LIB CONTA POUPAN')) {
            const labelRegex = /Label1">(.*?)<\/span>/g;
            const labelMatches = trContent.matchAll(labelRegex);
            for (const labelMatch of labelMatches) {
                return labelMatch[1];
            }
            break;
        }
    }
    return null;
}

function getPending(situacao) {
    const pendencies = [];
    const isInvalidState = situacao === 'cancelado' || situacao === 'cancelada' || situacao === 'reprovado';
    if (isInvalidState) {
        pendencies.push({ observacao: `Proposta ${situacao}` });
        pendencies.push({ tipo_pendencia: 'Pendencia Santander' });
    }
    return pendencies;
}

async function getElementText(page, selector) {
    return page.$eval(selector, span => span.textContent);
}
