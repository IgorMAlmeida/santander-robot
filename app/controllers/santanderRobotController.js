import express from 'express';
import { loginSantander } from '../services/loginSantander.js';
import { getOperationScreen } from '../services/getOperationScreen.js';
import puppeteer from 'puppeteer';
import { sleep } from '../../utils.js';
import { loginSantanderPartner } from '../services/loginSantanderPartner.js';
import {getProposalData} from '../services/santanderPartnerService.js'

const app = express();

const retryTimes = 5;
let retriedTimes = 0;

export async function santanderRobot(req, res) {
  try {
    const codProposalProposal = req.body.propostaId;      
    const username = 'EX114688';
    const password = 'CF@5410';

    const { page, browser } = await loginSantander(username, password);
    const data = await getOperationScreen(page, 'andamento', codProposalProposal);

    if (!data.status) {
      if(retriedTimes < retryTimes) {
        // await browser.close();
        retriedTimes++;
        // await santanderRobot(req, res);
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

  } catch (err) {
    return ({ err: true, mensagem: 'Internal Server Error' });
  }
}


export async function santanderRobotProposal(req, res) {
  try {
    const { propostaId } = req.body;

    if (!propostaId || propostaId.trim().length === 0) {
      return { error: 'Campo propostaId obrigatório.' };
    }

    const result = await getProposalData(propostaId);

    if (result?.error) {
      return { error: result.error };
    }

    return { status: true, dados: result };
  } catch (error) {
    console.error('Erro no controller:', error);
    return { error: 'Erro ao executar o robô.' };
  }
}