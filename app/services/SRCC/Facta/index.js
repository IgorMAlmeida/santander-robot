import { initialize } from "../../Approval/InitializePuppeteer.js";
import { login } from "./login.js";
import { formatCpf } from "../../../utils/formatter.js";
import sendConsult from "./sendConsult.js";
import getConsult from "./getConsult.js";
import getRegistrations from "./getRegistrations.js";
import ac from "@antiadmin/anticaptchaofficial";
import dotenv from "dotenv";
import APIService from "../../Approval/APIService.js";
dotenv.config();

export default async function srcc(people) {
  let { page, browser } = await initialize();

  try {
    const loginResult = await login(page);
    
    if (!loginResult.status) {
      throw new Error(`Falha no login: ${loginResult.data}`);
    }
    
    const cookie = await page.evaluate(() => {
      return document.cookie;
    });
    
    const peopleWithRegistrations = await processRegistrations(people);

    await sendConsults(peopleWithRegistrations, cookie);

    await browser.close();

    return await verifySRCC(peopleWithRegistrations, cookie);
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function processRegistrations(people) {
  const peopleNeedingRegistration = people.filter(person => !person?.registration);
  
  if (peopleNeedingRegistration.length === 0) {
    return people;
  }

  const registrations = await getRegistrations(
    peopleNeedingRegistration.map((person) => person.cpf)
  );

  const peopleWithRegistrations = peopleNeedingRegistration.map((person) => {
    return {
      ...person,
      registration: registrations[person.cpf],
    };
  });

  return [...people.filter(person => person.registration), ...peopleWithRegistrations];
}

async function sendConsults(people, cookie) {
  const websiteKey = "6LefgIEcAAAAAMlY8s_hpgHPtYqhNmZ_Fu-DJDVg";
  ac.setAPIKey(process.env.ANTICAPTCHA_KEY);
  ac.setSoftId(0);
  const gresponse = await ac.solveRecaptchaV2Proxyless(
    "https://desenv.facta.com.br/sistemaNovo/consultaSrcc.php",
    websiteKey
  );

  for (const person of people) {
    const formattedCpf = formatCpf(person.cpf);

    if (!person.registration) {
      continue;
    }

    await sendConsult(formattedCpf, person.registration, cookie, gresponse);
  }
}

async function verifySRCC(people, cookie) {
  const consults = await getConsult(cookie);

  const response = [];
  for (const person of people) {
    const consult = consults.find(consult => formatCpf(consult.cpf) === formatCpf(person.cpf));

    if (!consult) {
      continue;
    }

    const data = {
      cpf: person.cpf,
      srcc: consult.status !== "Operação passível de comissão",
    };

    await APIService.post(
      process.env.FACTA_SRCC_POSTBACK_URL,
      {
        "Content-Type": "application/json",
        "ROBOT-KEY": process.env.FACTA_SRCC_POSTBACK_ROBOT_KEY,
      },
      data
    );
    response.push(data);
  }

  return response;
}