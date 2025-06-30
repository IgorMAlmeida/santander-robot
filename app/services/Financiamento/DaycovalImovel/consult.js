import loginDaycovalImovel from "./login.js";
import { typeInput, selectClick } from "./utils.js";
import puppeteer from "puppeteer-extra";

export default async function simulation(data) {
  try {
    let response = "Teste";

    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
      slowMo: 50,
    });
  
    const pagesBefore = await browser.pages();
    const page = pagesBefore[0];
    const DAYCOVAL_IMOVEL_URL = (process.env.DAYCOVAL_IMOVEL_URL || 'https://wspf.banco.DAYCOVAL/wsImoveis/AreaRestrita/Default.aspx?ReturnUrl=%2fwsImoveis%2fAreaRestrita%2fConteudo%2fHome.aspx').replace(/"/g, '').trim();

    await page.goto(DAYCOVAL_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada: ", DAYCOVAL_IMOVEL_URL);

    await loginDaycovalImovel(page);
    await selectClick(page, 'a[href="/wsImoveis/AreaRestrita/Conteudo/Proposta/Listar.aspx"]',1000);

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await typeInput(page, '#txtCPF', data);
        await selectClick(page, '#btnFiltrar',1000);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const status = await getProposalStatus(page);
        let statusProposta = status;
        let spanStatusProposta = status;
        let motivoRecusa = status;

        response = {
            Proposta: data,
            StatusFaseProposta: statusProposta,
            Status: spanStatusProposta,
            Motivo: motivoRecusa
        };
      } catch (error) {
        console.error('❌ Erro ao preencher os campos:', error);
    }

    await browser.close();
    return {
      status: true,
      response,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
      details: error.details || undefined,
    };
  }
}

async function getProposalStatus(page) {
  // Extrair o status da primeira linha da tabela
  const status = await page.evaluate(() => {
    const row = document.querySelector('tbody tr:first-child'); // Seleciona a primeira linha dentro do tbody
    if (row) {
      const statusElement = row.querySelector('td:nth-child(7) .statusLabel');
      return statusElement ? statusElement.innerText.trim() : null; // Retorna o texto do status
    }
    return null;
  });

  console.log(status);
  return status;
}
