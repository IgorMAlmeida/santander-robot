import { clickElementByXpath, sleep } from "../../../../utils.js";

export default async function verifySRCC(page) {
  const buttonIsDisabled = await page.evaluate(
    () => {
      const button = document.evaluate('//*[@id="tblListaProposta"]/tbody/tr/td[17]/button[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      return button.disabled;
    },
    page
  );

  if (buttonIsDisabled) {
    await clickElementByXpath(page, '//*[@id="btnSRCC"]');

    await sleep(1000);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Enter");

    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    await sleep(10000);
  }

  return true;
}