import { initialize } from "../InitializePuppeteer.js";
import { personal_data } from "./personal_data.js";
import { simulationData } from "./simulation_data.js";
import { simulator } from "./simulator.js";
import validate from "./validate.js";
import { ITAU_URL } from "./constants.js";

export default async function simulation(data) {
  try {
    const { isValid, errors } = validate(data);

    if (!isValid) {
      const error = new Error("Existem dados inválidos ou faltando.");
      error.details = errors;
      throw error;
    }

    let { page, browser } = await initialize();

    await page.goto(ITAU_URL, {
      waitUntil: "domcontentloaded",
    });

    await personal_data(page, data);
    await simulator(page, data);
    const response = await simulationData(page);

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
