import { clickElementByXpath, sleep, getElementText, checkElement, getElementTextByXpath } from "../../utils.js";

export async function scrappingProposalData(targetPage, data) {
    await sleep(500);
    await clickElementByXpath(targetPage, `//*[@id="ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBSit"]`);

    data.proximaAtividade = await getElementText(targetPage, '#ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBSit');
    data.situacao = await getElementText(targetPage, '#ctl00_cph_ucAprCns_j0_j1_grConsulta_ctl02_LkBDesc');
    
    await sleep(1500);
    const liquidValue = await getLiquidValue(targetPage);
    const pendencies = getPending(data.situacao);
    await targetPage.waitForSelector('::-p-xpath(//*[@id="ctl00_cph_j0_j1_UpdatePanel1"]/table/tbody/tr[1]/td[2]/table[1]/tbody/tr/td/table/tbody)');

    data.codProposta = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblNumeroDaProposta');
    data.cpf = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblCpf');
    data.nomeCliente = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblCliente');
    data.dataBase = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblDataBase');
    data.dataAtivo = null;
    data.horaAtivo = null;
    data.produto = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblProduto');
    data.status = `${data.proximaAtividade} ${data.situacao}`;
    data.liberacao1 = null;
    data.liberacao2 = null;
    data.convenio = null;
    data.valorPrincipal = liquidValue;
    data.valorParcela = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblValorParcela');
    data.promotora = null;
    data.digitadora = null;
    data.usuario = null;
    data.loginDigitador = null;
    data.valorBruto = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblValorSolicitado');
    data.propostaAverbada = 'N';
    const isElementPresent = await checkElement(targetPage, '//*[@id="ctl00_cph_j0_j1_UcDadosCliente_lbPercAverb"]');
    if (isElementPresent) {    
        data.propostaAverbada = await getElementTextByXpath(targetPage, '//*[@id="ctl00_cph_j0_j1_UcDadosCliente_lbPercAverb"]') === '100%' ? 'S' : data.propostaAverbada;
    }
    data.valorTroco = null;
    data.valorSeguro = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblSeguro');
    data.simulacaoRefin  = null;
    data.dataAverbacao   = null;
    data.dataPagamento   = null;
    data.dataPrimeiroVencimento = await getElementText(targetPage, '#ctl00_cph_j0_j1_UcDadosCliente_lblVcto1Parcela');
    data.dataUltimoVencimento = null;
    data.pendenciado    = null;
    data.statusId  = null;
    data.temParadinha   = null;
    data.dataSolicitacaoSaldo = null;
    data.dataPrevistaSaldo  = null;
    data.dataRetornoSaldo  = null;
    data.saldoEnviado  = null;
    data.saldoRetornado   = null;
    data.pendencias = pendencies;
    data.obs = null;

    const dataReturn = {"propostas": data};
    return dataReturn;
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

function getPending(situation) {
    const pendencies = [];
    const isInvalidState = situation === 'cancelado' || situation === 'cancelada' || situation === 'reprovado';
    if (isInvalidState) {
        pendencies.push({ observacao: `Proposta ${situation}` });
        pendencies.push({ tipo_pendencia: 'Pendencia Santander' });
    }
    return pendencies;
}
