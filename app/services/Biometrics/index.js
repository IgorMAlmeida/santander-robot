import { initialize } from "./InitializePuppeteer.js";
import { consult } from "./consult.js";

export default async function biometrics(cpfs) {
  let { page, browser } = await initialize();

  let result = [];

  for (const cpf of cpfs) {
    try {
      const formattedCpf = cpf.replace(/\D/g, "");
      const consultResult = await consult(page, formattedCpf);

      result.push({
        cpf: cpf,
        biometrics: consultResult.data,
      });
    } catch (error) {
      result.push({
        cpf: cpf,
        error: error.message,
      });

      await browser.close();
      let recreate = await initialize();
      page = recreate.page;
      browser = recreate.browser;
    }

    console.log(`Processou o CPF ${cpf}`);
  }

  await browser.close();

  return result;
}
