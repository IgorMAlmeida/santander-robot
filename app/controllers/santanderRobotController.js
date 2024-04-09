import express from 'express';
import { loginSantander } from '../services/loginSantander.js';
import { getOperationScreen } from '../services/getOperationScreen.js';

const app = express();

const retryTimes = 5;
let retriedTimes = 0;

export async function santanderRobot(req, res) {
  try {
    const codProposalProposal = req.body.propostaId;      
    const username = 'EX114688';
    const password = 'CF@5400';

    const { page, browser } = await loginSantander(username, password);
    const data = await getOperationScreen(page, 'andamento', codProposalProposal);

    if (!data.status) {
      if(retriedTimes < retryTimes) {
        await browser.close();
        retriedTimes++;
        await santanderRobot(req, res);
        return;
      }
      await browser.close();
      throw new Error(data.message);
    }

    const responseObj = {
        erro: false,
        dados: data.data
    };

    await browser.close();
    return (responseObj);

  } catch (error) {
    return ({ status: false, mensagem: 'Internal Server Error' });
  }
}
