import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

import { consultSRCC } from '../services/C6/consultSRCC.js';
import { loginSRCC } from '../services/C6/loginSRCC.js';
import fs from 'fs';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function ConsultSRCCByArray(req, res) {
    const proposals = req?.body?.proposals;

    if (!proposals) {
        return res.status(400).json({ error: 'Missing proposals' });
    }

    const result = await processData(proposals);

    if (!result) {
        return res.status(500).json({ error: 'Error processing data' });
    }

    fs.writeFileSync(`proposals_${Date.now()}.csv`, result.map(row => Object.values(row).join(';')).join('\n'));

    return res.status(200).json(result);
};

async function processData(proposals) {
    let page = await initialize();
    let FISession = null;

    let result = [];
    
    for (const proposal of proposals) {
        try {
            if (!FISession) {
                const loginData = await loginSRCC(page);
    
                if (!loginData.status) {
                    throw new Error(loginData.data);
                }
    
                FISession = loginData.data;
            }
    
            await page.goto(`https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Esteira/AprovacaoConsulta/UI.AprovacaoConsultaCanInt.aspx?FISession=${FISession}`, { waitUntil: 'domcontentloaded' });
    
            const consult = await consultSRCC(page, proposal.toString());
    
            result.push({
                'Proposta': proposal,
                'Registro SRCC': consult.data,
            });
        } catch (error) {
            result.push({
                'Proposta': proposal,
                'Erro': error.message,
            });

            await page.close();
            page = await initialize();
            FISession = null;
        }

        console.log(`Processed ${proposals.indexOf(proposal) + 1} of ${proposals.length}`);
    };

    return result;
}

async function initialize() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
        ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
        executablePath: executablePath(),
        protocolTimeout: 10000
    });

    const page = await browser.newPage();

    return page;
}
