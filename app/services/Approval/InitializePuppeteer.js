import {executablePath} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import logger from "../../utils/logger.js";
import os from 'os';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function initialize() {
    logger.logMethodEntry('InitializePuppeteer.initialize');
    
    try {
        // Coletar informações do sistema para diagnóstico
        const systemInfo = {
            platform: os.platform(),
            release: os.release(),
            architecture: os.arch(),
            totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
            freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
            cpus: os.cpus().length,
            puppeteerPath: executablePath()
        };
        
        logger.debug("Inicializando navegador Puppeteer", systemInfo);
        
        const browserConfig = {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: false,
            ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
            executablePath: executablePath(),
        };
        
        logger.debug("Configuração do navegador", { 
            config: browserConfig,
            plugins: ['StealthPlugin', 'AdblockerPlugin']
        });
        
        const browser = await puppeteer.launch(browserConfig);
        
        logger.debug("Navegador iniciado com sucesso", {
            wsEndpoint: browser.wsEndpoint(),
            version: await browser.version(),
            pagesCount: (await browser.pages()).length
        });
        
        const page = await browser.newPage();
        
        // Configurar tratamento de erros na página
        page.on('error', err => {
            logger.logError('Erro na página do navegador', err, {
                url: page.url()
            });
        });
        
        page.on('pageerror', err => {
            logger.error('Erro de JavaScript na página', {
                error: err.toString(),
                url: page.url()
            });
        });
        
        // Capturar logs do console
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                logger.error(`Console do navegador (${type})`, {
                    message: text,
                    url: page.url()
                });
            } else if (type === 'warning') {
                logger.warn(`Console do navegador (${type})`, {
                    message: text,
                    url: page.url()
                });
            } else {
                logger.debug(`Console do navegador (${type})`, {
                    message: text,
                    url: page.url()
                });
            }
        });
        
        logger.debug("Nova página criada");
        
        const userAgent = await page.evaluate(() => navigator.userAgent);
        const viewport = page.viewport();
        
        logger.logMethodExit('InitializePuppeteer.initialize', { 
            success: true 
        }, {
            userAgent,
            viewport
        });
        
        return { page, browser };
    } catch (error) {
        logger.logError("Falha ao inicializar o Puppeteer", error, {
            executablePath: executablePath(),
            platform: os.platform(),
            nodeVersion: process.version
        });
        throw error;
    }
}
