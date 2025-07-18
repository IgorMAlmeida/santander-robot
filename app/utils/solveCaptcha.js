import ac from "@antiadmin/anticaptchaofficial";
import dotenv from 'dotenv';

dotenv.config();

export const solveCaptcha = async (page, url, websiteKey) => {
  ac.setAPIKey(process.env.ANTICAPTCHA_KEY);
  ac.setSoftId(0);
  const gresponse = await ac.solveRecaptchaV2Proxyless(url, websiteKey);

  await page.evaluate((token) => {
    document.querySelector('[name="g-recaptcha-response"]').value = token;
  }, gresponse);

  return gresponse;
};