import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";

puppeteer.use(StealthPlugin());

export async function initialize() {
  const randomWidth = 1200 + Math.floor(Math.random() * 200);
  const randomHeight = 700 + Math.floor(Math.random() * 200);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      `--window-size=${randomWidth},${randomHeight}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: randomWidth, height: randomHeight });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9",
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  return { page, browser };
}
