import express from 'express';
import { loginSantander } from '../services/loginSantander.js';
import { getOperationScreen } from '../services/getOperationScreen.js';

const app = express();
const retryTimes = 5;
let retriedTimes = 0;

export async function santanderRobot(req, res) {
  try {
      const codProposalProposal = req.query.proposal.toString();
      const username = req.query.username.toString();
      const password = req.query.password.toString();

      const { page, browser } = await loginSantander(username, password);
      const data = await getOperationScreen(page, 'andamento', codProposalProposal);

      if (!data.status) {
        if(retriedTimes < retryTimes) {
          retriedTimes++;
          santanderRobot(req, res);
        }
        throw new Error(data.message);
      }

      const responseObj = {
          erro: false,
          dados: data.data
      };
      res.status(200).json(responseObj);

      await browser.close();
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ status: false, mensagem: 'Internal Server Error' });
  }
}
