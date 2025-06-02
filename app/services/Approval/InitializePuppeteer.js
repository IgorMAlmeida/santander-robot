import {executablePath} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import logger from "../../utils/logger.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function initialize() {
    logger.debug("Initializing puppeteer browser");
    
    try {
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: false,
          ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
          executablePath: executablePath(),
        });
        
        logger.debug("Browser launched successfully");
        
        const page = await browser.newPage();
        logger.debug("New page created");
        
        return { page, browser };
    } catch (error) {
        logger.error("Failed to initialize puppeteer", {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}
