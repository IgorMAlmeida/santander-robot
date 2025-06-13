import { clickElementByXpath, sleep } from "../../../../utils.js";

export async function GovMT(page, params) {
	try{
		await sleep(500);
		await clickElementByXpath(page,'/html/body/div/div/form/div[2]/div/div[4]/div[2]/fieldset/div/div[1]/span[2]/input');
		await clickElementByXpath(page,'/html/body/div/div/form/div[2]/div/div[4]/div[2]/fieldset/div/div[2]/fieldset/span/label/input');
		await clickElementByXpath(page,'//*[@id="id14"]');
		await sleep(1000);
		await clickElementByXpath(page,'/html/body/div/div/div[1]/div/div[3]/a/span');
		await clickElementByXpath(page,'/html/body/div/div/div[1]/div/div[3]/div/div/a/span');
		await sleep(1000);
		await page.evaluate((params) => {
			document.querySelector('#cpfServidor').value = params.cpf;
			document.querySelector('#matriculaServidor').value = params.registration;
		}, params);
		await clickElementByXpath(page,'//*[@id="id23"]');

		return {
			status: true,
			data: page
		}; 
  } catch (error) {
    console.error('Error during consult GOV MT:', error);
    return {
      status: false,
      data: error
    };
  }
}