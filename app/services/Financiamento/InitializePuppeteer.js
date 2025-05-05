import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(
  AdblockerPlugin({
    blockTrackers: true,
    usePrecompiledBinary: true,
  })
);

export async function initialize() {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--no-zygote",
      "--safebrowsing-disable-auto-update",
    ],
    headless: false,
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    executablePath: executablePath(),
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1600, height: 3000 });

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    const url = req.url();

    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      return req.abort();
    }

    const blockList = [
      "google-analytics.com",
      "googletagmanager.com",
      "doubleclick.net",
      "facebook.net",
      "adsbygoogle.js",
      "hotjar.com",
      "segment.io",
      "optimizely.com",
      "cdn.heapanalytics.com",
      "intercom.io",
      "bugsnag.com",
    ];
    if (blockList.some((domain) => url.includes(domain))) {
      return req.abort();
    }

    req.continue();
  });

  return { page, browser };
}
