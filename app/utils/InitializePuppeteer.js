import {executablePath} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import logger from "./logger.js";
import path from "path";
import { fileURLToPath } from "url";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../services/Anticaptcha/anticaptcha-plugin');

export async function initialize(headless = false) {
    logger.logMethodEntry('InitializePuppeteer.initialize');
    
    try {
        logger.debug("Inicializando navegador Puppeteer");
        
        const browserConfig = {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--allow-running-insecure-content",
            "--disable-blink-features=AutomationControlled",
            "--mute-audio",
            "--no-zygote",
            "--no-xshm",
            "--window-size=1280,720",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-dev-shm-usage",
            "--enable-webgl",
            "--ignore-certificate-errors",
            "--lang=en-US,en;q=0.9",
            "--password-store=basic",
            "--disable-gpu-sandbox",
            "--disable-software-rasterizer",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-infobars",
            "--disable-breakpad",
            "--disable-canvas-aa",
            "--disable-2d-canvas-clip-aa",
            "--disable-gl-drawing-for-tests",
            "--enable-low-end-device-mode",
            "--disable-extensions-except=" + configPath,
            "--load-extension=" + configPath,
          ],
          headless,
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
