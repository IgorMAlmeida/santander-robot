import {executablePath} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import logger from "../../utils/logger.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function initialize() {
    logger.logMethodEntry('InitializePuppeteer.initialize');
    
    try {
        logger.debug("Inicializando navegador Puppeteer");
        
        const browserConfig = {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: false,
            ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
            executablePath: executablePath(),
        };
        
        logger.debug("Configuração do navegador");
        
        const browser = await puppeteer.launch(browserConfig);
        
        logger.debug("Navegador iniciado com sucesso");
        
        const page = await browser.newPage();
        
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
        logger.logError("Falha ao inicializar o Puppeteer", error);
        throw error;
    }
}
