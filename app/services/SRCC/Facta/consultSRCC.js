import ac from "@antiadmin/anticaptchaofficial";
import { clickElementByXpath, getElementByXpath, getElementTextByXpath, sleep, typeByXpath } from "../../../../utils.js";
import dotenv from 'dotenv';
dotenv.config();

export default async function consultSRCC(page, cpf, benefit) {
  try {
    const websiteKey = "6LefgIEcAAAAAMlY8s_hpgHPtYqhNmZ_Fu-DJDVg";
    ac.setAPIKey(process.env.ANTICAPTCHA_KEY);
    ac.setSoftId(0);
    const gresponse = await ac.solveRecaptchaV2Proxyless(
      "https://desenv.facta.com.br/sistemaNovo/consultaSrcc.php",
      websiteKey
    );

    await page.evaluate((token) => {
      document.querySelector('[name="g-recaptcha-response"]').value = token;
    }, gresponse);

    const formattedCpf = numberToCpf(cpf);
    await typeByXpath(page, '//*[@id="cpf"]', formattedCpf);
    await typeByXpath(page, '//*[@id="beneficio"]', benefit);
    
    await clickElementByXpath(page, '//*[@id="consultarDadosSRCC"]');
    await sleep(5000);

    const srccElement = await getElementByXpath(page, '//*[@id="td0"]/td[5]', 10000);
    const srccText = await srccElement.evaluate(el => el.textContent);

    return srccText.includes("NÃO");
  } catch (err) {
    console.error("Error in consultSRCC:", err);
    return false;
  }
}

const numberToCpf = (number) => {
  number = number.replace(/\D/g, "");
  if (number.length !== 11) return number;
  return number.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};