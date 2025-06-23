import { initialize } from "../../Approval/InitializePuppeteer.js";
import { login } from "./login.js";
import { consult } from "./consult.js";
import getRegistration from "./getRegistration.js";

export default async function srcc(people) {
  let { page, browser } = await initialize();

  await login(page);

  let result = [];

  for (const person of people) {
    try {
      const formattedCpf = person.cpf.replace(/\D/g, "");
      const registration = await getRegistration(formattedCpf);

      if (!registration) {
        throw new Error("Matricula não encontrada");
      }

      const consultResult = await consult(page, person, registration);

      result.push({
        cpf: person.cpf,
        srcc: consultResult.data,
      });
    } catch (error) {
      result.push({
        cpf: person.cpf,
        error: error.message,
      });

      await browser.close();
      let recreate = await initialize();
      page = recreate.page;
      browser = recreate.browser;
    }

    console.log(`Processou a pessoa ${person.cpf}`);
  }

  await browser.close();

  return result;
}
