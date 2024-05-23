import { loginOle } from '../services/loginOle.js';
import { getConsultProposalScreen } from '../services/getConsultProposalScreen.js';
import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));


export async function ProposalConsult(req, res) {
  let result = [];

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    executablePath: executablePath()
  });

  const page = await browser.newPage();

  try {
    const url = process.env.OLE_URL_BASE;
    const username = process.env.OLE_LOGIN;
    const password = process.env.PASS_LOGIN;
    const proposals = req?.body?.proposals; 
    
    for(const proposal of proposals) {
      await loginOle(page, url, username, password);

      const data = await getConsultProposalScreen(page, proposal.cpf, proposal.codProposal.toString(), proposal.date);
      const hasValue = data.status;
      
      if (!hasValue) {
        result.push({
          proposal: proposal.codProposal,
          status: false,
          data: "Erro na consulta"
        });

        continue;
      }

      result.push({
        proposal: proposal.codProposal,
        status: true,
        data: data.data
      });

      console.log(`The process was completed successfully for proposal: ${proposal.codProposal}`);
      console.log(`Processed ${proposals.indexOf(proposal) + 1} of ${proposals.length} proposals`);
    }

    await browser.close();

    return {
      status: true,
      response: "The process was completed successfully",
      data: result
    };
  } catch (err) {
    console.log(err);
    await browser.close();

    return {
      status: false,
      response: err.message,
      data: null
    };
  }
}
