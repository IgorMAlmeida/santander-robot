import { blockUnnecessaryRequests, getElementTextByXpath, sleep } from "../../../../utils.js";

export async function scrapingMunSP(page) {

	try{
		await blockUnnecessaryRequests(page);
		await sleep(500);
		await page.goto('https://www.portaldoconsignado.com.br/consignatario/pesquisarMargem?6', { waitUntil: 'networkidle0' });
		await sleep(500);
		
		const cpf = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[1]/span');
		const nome = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[2]/span');
		const orgao = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[3]/div[1]/span');
		const identificacao = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[3]/div[2]/span');
		const mesReferencia = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[3]/div[3]/span');
		const dataProcessamento = await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[1]/div[2]/div/div[3]/div[4]/span');
		let produtos = [];

		produtos.push({
			'Dados:' :{
				'CPF' : cpf,
				'Nome' : nome,
				'Orgao' : orgao,
				'Identificacao' : identificacao,
				'Mes Referencia' : mesReferencia,
				'Data Processamento' : dataProcessamento
			},
			'Margem Bruta': {
				'Provimento 1': {
					'CONSIGNACOES FACULTATIVAS	' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[3]/div[2]/div/div/span[1]/div/table/tbody/tr[1]/td[2]/span'),
					'CARTAO DE CREDITO	' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[3]/div[2]/div/div/span[1]/div/table/tbody/tr[2]/td[2]/span'),
					'CARTÃO DE BENEFÍCIO		' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[3]/div[2]/div/div/span[1]/div/table/tbody/tr[3]/td[2]/span'),
				}
			},
			'Margem Disponível - Total' : {
				'Provimento 1': {
					'CONSIGNACOES FACULTATIVAS	' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[4]/div[2]/div/div/span/div/table/tbody/tr[1]/td[2]/span'),
					'CARTAO DE CREDITO	' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[4]/div[2]/div/div/span/div/table/tbody/tr[2]/td[2]/span'),
					'CARTÃO DE BENEFÍCIO		' : await getElementTextByXpath(page, '/html/body/div/div/div[2]/div/form/div[2]/div/div[4]/div[1]/div/span/div/div[4]/div[2]/div/div/span/div/table/tbody/tr[3]/td[2]/span'),
				}
			}
		});
		
		return {
			status: true,
			data: produtos
		}; 
  } catch (error) {
		console.error('Error during scraping:', error);
    return {
      status: false,
      data: error
    };
  }

}
