import {executablePath} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function initialize() {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
      executablePath: executablePath(),
    });

    const page = await browser.newPage();

    return { page, browser };
}
