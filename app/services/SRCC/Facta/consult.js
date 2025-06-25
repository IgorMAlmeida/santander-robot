import consultSRCC from "./consultSRCC.js";
import APIService from "../../Approval/APIService.js";

export async function consult(page, person, registration) {
  try {
    await page.goto(`https://desenv.facta.com.br/sistemaNovo/consultaSrcc.php`);

    const hasSRCC = await consultSRCC(page, person.cpf, registration);

    if (hasSRCC) {
      if(!person?.postBack) {
        await APIService.post(person.postBack.url, person.postBack.headers, {
          srcc: "S",
        });
      }

      throw new Error("Proposta possui registro de SRCC");
    }
  
    if(!person?.postBack) {
      await APIService.post(person.postBack.url, person.postBack.headers, {
        srcc: "N",
      });
    }

    return {
      status: true,
      data: `Proposta não possui registro de SRCC`,
    };
  } catch (error) {
    return { 
      status: false,
      data: error.message,
    };
  }
}

