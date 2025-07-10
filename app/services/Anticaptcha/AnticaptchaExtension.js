import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'anticaptcha-plugin/js/config_ac_api_key.js');

export const AnticaptchaExtension = async () => {

  const apiKey = process.env.ANTICAPTCHA_KEY;
  if (fs.existsSync(configPath)) {
    let confData = fs.readFileSync(configPath, 'utf8');
    confData = confData.replace(/antiCapthaPredefinedApiKey = ''/g, `antiCapthaPredefinedApiKey = '${apiKey}'`);
    fs.writeFileSync(configPath, confData, 'utf8');
  } else {
    console.error('anticaptcha-plugin configuration not found!')
  }
}
