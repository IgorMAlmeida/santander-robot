import { loginOle } from '../services/loginOle.js';
import { getConsultProposalScreen } from '../services/getConsultProposalScreen.js';
import ApiService from '../services/api.service.js';
import { initialize } from '../services/OLE/InitializePuppeteer.js';
import dotenv from 'dotenv';
dotenv.config();

export async function ProposalConsult(fileId, proposals) {
  const { page, browser } = await initialize();
  
  try {
    const url = process.env.OLE_URL_BASE;
    const username = process.env.OLE_LOGIN;
    const password = process.env.PASS_LOGIN;
    
    const stats = {
      processed: 0,
      failed: 0,
      total: proposals.length
    };

    await loginOle(page, url, username, password);

    for (const proposal of proposals) {
      await processProposal(page, proposal, stats, fileId);
    }

    await browser.close();
    
    return {
      status: true,
      response: "The process was completed successfully",
      data: {
        processed: stats.processed,
        failed: stats.failed
      }
    };
  } catch (error) {
    await browser.close();
    
    return {
      status: false,
      response: error.message,
      data: null
    };
  }
}

async function processProposal(page, proposal, stats, fileId) {
  const { cpf, codProposal, date } = proposal;
  const proposalId = codProposal.toString();
  
  const consultResult = await getConsultProposalScreen(page, cpf, proposalId, date);
  const isSuccessful = consultResult.status;
  
  if (!isSuccessful) {
    stats.failed++;
    await updateProposalStatus(fileId, proposalId, "N/A", stats);
    return;
  }
  
  stats.processed++;
  await updateProposalStatus(fileId, proposalId, consultResult.data, stats);
}

async function updateProposalStatus(fileId, proposalId, userBank, stats) {
  await ApiService.post(`/proposals/ole/user_bank/update/${fileId}`, {
    processed: stats.processed,
    failed: stats.failed,
    proposal: proposalId,
    user_bank: userBank
  });
}
