import mysql from 'mysql2/promise';
import puppeteer from 'puppeteer';
import { sleep } from '../../utils.js';

const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'nova_senha',
    database: 'main'
  });
  
export async function saveSessionData(userId, sessionData) {
    try {
    const query = 'INSERT INTO session (user_id, data) VALUES (?, ?)';
    const [result] = await connection.execute(query, [userId, JSON.stringify(sessionData)]);
    console.log('Dados de sessão salvos:', result);
    } catch (error) {
    console.error('Erro ao salvar os dados de sessão:', error);
    }
}

export async function deleteSessionByUserId(userId) {
    try {
    const query = 'DELETE FROM session WHERE user_id = ?';
    const [result] = await connection.execute(query, [userId]);
    console.log('Sessão deletada com sucesso:', result);
    } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    }
}

export async function getSessionData(userId) {
    try {
    const query = 'SELECT data FROM session WHERE user_id = ?';
    const [rows] = await connection.execute(query, [userId]);
        
    const sessionData = rows[0]?.data ? rows[0]?.data : null;

    
    return sessionData;
    } catch (error) {
    console.error('Erro ao recuperar dados da sessão:', error.message);
    throw error;
    }
}

export async function restoreSession(sessionData) {
    const browser = await puppeteer.launch({
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    if (sessionData.cookies) {
    await page.setCookie(...sessionData.cookies);
    }

    await page.goto('https://www.parceirosantander.com.br', { waitUntil: 'networkidle0' });

    if (sessionData.localStorage) {
    await page.evaluate((localStorageData) => {
        Object.entries(localStorageData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
        });
    }, sessionData.localStorage);
    }

    if (sessionData.sessionStorage) {
    await page.evaluate((sessionStorageData) => {
        Object.entries(sessionStorageData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
        });
    }, sessionData.sessionStorage);
    }

    await page.goto('https://www.parceirosantander.com.br/spa-base/logged-area/support', { waitUntil: 'networkidle0' });
    await sleep(1000);

    return { browser, page };
}