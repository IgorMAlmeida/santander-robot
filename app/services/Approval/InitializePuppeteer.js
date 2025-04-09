import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { executablePath } from "puppeteer";

export async function initialize() {
    puppeteer.use(StealthPlugin());
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
    
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
        executablePath: executablePath(),
        protocolTimeout: 15000,
    });

    const page = await browser.newPage();

    return { page, browser };
}
