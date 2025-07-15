import { awaitElement, clickElementByXpath, sleep } from '../../../utils.js';
import path from 'path';
import fs from 'fs';

export async function logoutBmg(page) {
  const debugDir = path.join(process.cwd(), 'debug_logs');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  try {
    await page.goto('https://www.bmgconsig.com.br/login/logout.jsp', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await page.screenshot({
      path: path.join(debugDir, 'logout-confirm.png'),
      fullPage: true
    });
    await sleep(1000);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span')

    return { status: true, message: 'sucesso' }
  } catch (erro) {
    console.log('cai no erro do logout', erro);
    return { status: false, message: erro }
  }
}