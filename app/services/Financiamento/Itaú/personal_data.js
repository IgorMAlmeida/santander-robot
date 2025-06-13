import { clickElementByXpath, sleep } from "../../../../utils.js";

export async function personal_data(page, data) {
  await sleep(3000);

  await page.type('::-p-xpath(//*[@id="ds-field-cpf"])', data.cpf);
  await page.type('::-p-xpath(//*[@id="ds-field-proponent_name"])', data.name);
  await page.type('::-p-xpath(//*[@id="ds-field-proponent_email"])', data.email);
  await page.type('::-p-xpath(//*[@id="ds-field-proponent_phone"])', data.phone);

  await clickElementByXpath(page, '//*[@id="gatsby-focus-wrapper"]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[8]/button');
}
