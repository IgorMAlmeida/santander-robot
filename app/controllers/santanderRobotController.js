import express from 'express';
import { loginSantander } from '../services/loginSantander.js';
import { getOperationScreen } from '../services/getOperationScreen.js';

const app = express();

export function santanderRobot(req, res) {
  try {
    const codProposalProposal = req.query.proposal.toString();
    const username = req.query.username.toString();
    const password = req.query.password.toString();

    const browserPromise = loginSantander(username, password);

    browserPromise.then(browser => {
        getOperationScreen(browser, 'andamento', codProposalProposal).then(data => {

          if (!data.status){
            throw new Error(data.message);
          } 

          const responseObj = {
                status: true,
                dados: data.data
            };
            res.status(200).json(responseObj);

        }).catch(error => {
            console.error('Error to get proposal data:', error);
            browser.close();
            res.status(500).json({ status: false, mensagem: 'Error to get proposal data' });
        });
        
    }).catch(error => {
        console.error('Error to get browser:', error);
        res.status(500).json({ status: false, mensagem: 'Error to get browser' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: false, mensagem: 'Internal Server Error' });
  }
}
