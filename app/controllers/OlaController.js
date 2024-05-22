import { loginOle } from '../services/loginOle.js';
import { getConsultProposalScreen } from '../services/getConsultProposalScreen.js';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
dotenv.config();

const retryTimes = 5;
let retriedTimes = 0;

export async function ProposalConsult(req, res) {
  let result = [];

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'], 
    executablePath: '/usr/bin/google-chrome'
  });

  const page = await browser.newPage();

  try {
    const proposals = req.body.proposals; 
    const url = process.env.OLE_URL_BASE;
    const username = process.env.OLE_LOGIN;
    const password = process.env.PASS_LOGIN;
    
    for(const proposal of proposals) {
      const inputProposal = await page.$('::-p-xpath(//*[@id="NumeroProposta"])');

      if(!inputProposal){
        const isLoggedIn = await loginOle(page, username, password, url);

        if (!isLoggedIn) {
          if(retriedTimes < retryTimes) {
            await browser.close();
            retriedTimes++;
            await ProposalConsult(req, res);
            return;
          }

          await browser.close();

          throw new Error('Error 500 OLE SITE');
        }
      }

      const data = await getConsultProposalScreen(page, proposal);
      const hasValue = data.status;
      
      if (!hasValue) {
        throw new Error(data.data);
      }

      result.push(data.data);
    }

    await browser.close();

    return {
      status: true,
      response: "The process was completed successfully",
      data: result
    };
  } catch (err) {
    await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
