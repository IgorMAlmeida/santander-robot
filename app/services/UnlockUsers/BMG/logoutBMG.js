import { awaitElement, clickElementByXpath, sleep } from "../../../../utils.js"
import path from 'path';
import fs from 'fs';

export async function logoutBmg(page) {
    const debugDir = path.join(process.cwd(), 'debug_logs');
    if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
    }

    try{
        const bodyPage = page;
        await page.goto('https://www.bmgconsig.com.br/principal/cabecalho.jsp', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.screenshot({
            path: path.join(debugDir, '1_pagina-carregada.png'),
            fullPage: true
        });
        console.log(page.url());
        console.log(page);
        await sleep(1000);
        await page.screenshot({
            path: path.join(debugDir, '1_antes-do-logout.png'),
            fullPage: true
        });

        await awaitElement(page, '//*[@id="dropdownUser"]/span');
        await clickElementByXpath(page, '//*[@id="dropdownUser"]/span');
        await sleep(500);
        await clickElementByXpath(bodyPage, '/html/body/header/div/div/div[3]/div/div[7]/div/ul/li[3]/a');
        await page.goto('https://www.bmgconsig.com.br/login/logout.jsp', {
            waitUntil: 'networkidle2',
            timeout: 30000
        })
        await page.screenshot({
            path: path.join(debugDir, 'logout-confirm.png'),
            fullPage: true
        });
        await clickElementByXpath(page, '//*[@id="buttonLink"]/span')

        return {status: true, message: 'sucesso'}
    }catch(erro){
        console.log('cai no erro');
        await sleep(5000);
        return {status: false, message: erro}
    }
}