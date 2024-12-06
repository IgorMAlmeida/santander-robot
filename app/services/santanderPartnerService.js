import { sleep } from '../../utils.js';
import { loginSantanderPartner } from './loginSantanderPartner.js';

export async function getProposalData(propostaId) {
  try {
    const { page, browser } = await loginSantanderPartner();

    await page.goto('https://www.parceirosantander.com.br/spa-base/logged-area/support', { waitUntil: 'networkidle0' });
    
    if(page.url() != 'https://www.parceirosantander.com.br/spa-base/logged-area/support'){
      throw new Error('Login falhou');
    }

    await page.waitForSelector('.dss-dropdown__select', { timeout: 1000 }); 
    await page.click('.dss-dropdown__select'); 
    await sleep(100);
    
    await page.waitForSelector('[data-option-value="proposalId"]', { timeout: 1000 }); 
    await page.click('[data-option-value="proposalId"]'); 
    await sleep(100);
    
    await page.waitForSelector('.dss-search-bar__input', { timeout: 1000 });
    await page.type('.dss-search-bar__input', propostaId); 
    await sleep(100);
    
    await page.waitForSelector('.dss-button', { timeout: 1000 });
    await page.click('.dss-button');
    await sleep(1000);

    await page.waitForSelector('dss-list', { timeout: 1000 });

    await page.click('dss-list dss-list-item:first-of-type');
    await sleep(1000);

    await page.waitForFunction(() => {
      const h1 = [...document.querySelectorAll('h1')].find(el => el.textContent.trim() === 'Dados da proposta');
      return h1 !== undefined;
    }, { timeout: 5000 });
    
    await page.evaluate(() => {
      const h1 = [...document.querySelectorAll('h1')].find(el => el.textContent.trim() === 'Dados da proposta');
      if (h1) {
        const divParent = h1.closest('.dss-accordion__item-header');
        if (divParent) {
          divParent.click();
        }
      }
    });

    await page.waitForSelector('.dss-accordion__item--active', { timeout: 1000 });
    await sleep(2000); 

    await page.waitForSelector('div.dss-mb-1 p.dss-body', { visible: true });

    const nomeCliente = await page.evaluate(() => {
      const nomeElement = [...document.querySelectorAll('div.dss-mb-1 p.dss-body')]
        .find(p => p.textContent.trim() === 'Nome do cliente');
      
      if (nomeElement && nomeElement.nextElementSibling) {
        return nomeElement.nextElementSibling.textContent.trim();
      }
      return null;
    });

    await sleep(1000); 
    const proposalData = await page.evaluate(() => {
      const container = document.querySelector('.dss-accordion__item--active');
      if (!container) return null;
    
      const items = container.querySelectorAll('.dss-mb-1');
      const data = {};
    
      items.forEach(item => {
        const titleElement = item.querySelector('.dss-caption');
        const valueElement = item.querySelector('.dss-body');
    
        if (titleElement && valueElement) {
          const title = titleElement.textContent.trim();
          const value = valueElement.textContent.trim();
          data[title] = value;
        }
      });
    
      return data;
    });

    await sleep(2000); 

    const data = await page.evaluate((proposalData, nomeCliente) => {
      const items = document.querySelectorAll('dss-list-item');
    
      const extractedData = Array.from(items).map(item => {
        const regra = item.querySelector('dss-list-item-title:nth-child(2) .dss-body')?.textContent.trim();
        const digitacao = item.querySelector('dss-list-item-title:nth-child(3) .dss-body')?.textContent.trim();
        const proposta = item.querySelector('dss-list-item-title:nth-child(4) .dss-body')?.textContent.trim();
        const status = item.querySelector('dss-list-item-title:nth-child(5) .dss-body')?.textContent.trim();
    
        const regraData = proposalData?.Regra || '';
        const valorTotalPagar = proposalData?.['Valor total a pagar'] || 0;
        const valorParcela = proposalData?.['Valor da parcela'] || 0;
        const valorSolicitado = proposalData?.['Valor solicitado'] || 0;
        const dataPrimeiroVencimento = proposalData?.['Data do primeiro vencimento'] || '';
        const cliente = nomeCliente|| '';
    
        return {
          nomeCliente: cliente || '',
          regra: regra || '',
          digitacao: digitacao || '',
          codProposta: proposta || '',
          status: status || '',
          cpf: null,
          dataBase: null,
          dataAtivo: null,
          horaAtivo: null,
          produto: regraData,
          situacao: status,
          liberacao1: null,
          liberacao2: null,
          convenio: null,
          valorPrincipal: valorTotalPagar,
          valorParcela: valorParcela,
          promotora: null,
          digitadora: null,
          usuario: null,
          loginDigitador: null,
          valorBruto: valorSolicitado,
          propostaAverbada: null,
          valorTroco: null,
          valorSeguro: null,
          simulacaoRefin: null,
          dataAverbacao: null,
          dataPagamento: null,
          dataPrimeiroVencimento: dataPrimeiroVencimento,
          dataUltimoVencimento: null,
          pendenciado: null,
          statusId: null,
          temParadinha: null,
          dataSolicitacaoSaldo: null,
          dataPrevistaSaldo: null,
          dataRetornoSaldo: null,
          saldoEnviado: null,
          saldoRetornado: null,
          pendencias: null,
          obs: null
        };
      });
    
      return extractedData;
    }, proposalData, nomeCliente);
    

    await page.waitForSelector('.container-userinfo', { timeout: 1000 }); 
    await page.click('.container-userinfo');
    await sleep(1000); 

    await page.waitForSelector('.dss-button--icon-button', { timeout: 1000 });
    await page.click('.dss-button--icon-button');

    await browser.close();

    return data;
  } catch (error) {
    console.error('Erro no serviço:', error);
    return { error: 'Erro ao coletar dados da proposta.' + error };
  }
}
