import puppeteer from "puppeteer";

export async function initialize() {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
        protocolTimeout: 15000,
    });

    const page = await browser.newPage();

    return { page, browser };
}
