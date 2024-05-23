import { loginOle } from '../services/loginOle.js';
import { getConsultProposalScreen } from '../services/getConsultProposalScreen.js';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { blockUnnecessaryRequests } from '../../utils.js';
dotenv.config();

export async function ProposalConsult(req, res) {
  let result = [];

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'], 
    executablePath: '/usr/bin/google-chrome'
  });

  const page = await browser.newPage();

  await blockUnnecessaryRequests(page);

  try {
    const proposals = req?.body?.proposals; 
    const url = process.env.OLE_URL_BASE;
    const username = process.env.OLE_LOGIN;
    const password = process.env.PASS_LOGIN;
    
    for(const proposal of proposals) {
      await loginOle(page, username, password, url);

      const data = await getConsultProposalScreen(page, proposal);
      const hasValue = data.status;
      
      if (!hasValue) {
        result.push({
          proposal: proposal,
          status: false,
          data: "Erro na consulta"
        });

        continue;
      }

      result.push({
        proposal: proposal,
        status: true,
        data: data.data
      });

      console.log(`The process was completed successfully for proposal: ${proposal}`);
      console.log(`Processed ${proposals.indexOf(proposal) + 1} of ${proposals.length} proposals`);
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
