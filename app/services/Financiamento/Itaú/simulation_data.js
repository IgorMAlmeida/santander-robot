import { getByXpath, getElementTextByXpath, sleep } from "../../../../utils.js";
import { LABELS } from "./constants.js";

export async function simulationData(page) {
  await page.waitForSelector(".resultCard");

  const listItems = await page.$$(".resultCard");
  const results = [];

  for (const item of listItems) {
    const index = listItems.indexOf(item);

    const title = await getElementTextByXpath(
      page,
      `//*[@id="gatsby-focus-wrapper"]/main/div[2]/div/div/div/div/div/div[2]/div[3]/ul/li[${index + 1}]/div/h3`
    );

    const parcelDivs = await item.$$(".resultCard__valuesContainer > div");

    const parcels = {};

    for (const div of parcelDivs) {
      const labelEl = await div.$(".resultCard__label");
      const valueEl = await div.$(".resultCard__value");

      const label = labelEl
        ? await page.evaluate((el) => el.textContent.trim(), labelEl)
        : null;
      const value = valueEl
        ? await page.evaluate((el) => el.textContent.trim(), valueEl)
        : null;

      if (label && value) {
        parcels[LABELS[label]] = value;
      }
    }

    await sleep(1000);

    const detailsButton = await getByXpath(
      page,
      `/html/body/div[1]/div[1]/main/div[2]/div/div/div/div/div/div[2]/div[3]/ul/li[${
        index + 1
      }]/div/div[3]/button[1]`
    );

    await page.evaluate((el) => el.click(), detailsButton);

    await sleep(1000);

    const conditionDivs = await page.$$('::-p-xpath(//*[@id="ds-modal-root-1"]/div/div/div[2]/div/ul/li)');
    const conditions = {};

    for (const div of conditionDivs) {
      const labelEl = await div.$(".resultCardDetails__label");
      const valueEl = await div.$(".resultCardDetails__value");

      const label = labelEl
        ? await page.evaluate((el) => el.textContent.trim(), labelEl)
        : null;
      const value = valueEl
        ? await page.evaluate((el) => el.textContent.trim(), valueEl)
        : null;

      if (label && value) {
        conditions[LABELS[label]] = value;
      }
    }

    results.push({
      title,
      parcels,
      conditions,
    });
  }

  return results;
}
