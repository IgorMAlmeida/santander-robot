import { clickElementByXpath, getByXpath, sleep } from "../../../../utils.js";

export async function simulator(page, data) {
  await sleep(5000);

  await clickElementByXpath(page, '//*[@id="ds-field-property_type"]');
  if (data.property_type === "Residencial") {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-property_type_0"]'
    );
  } else {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-property_type_1"]'
    );
  }

  await page.type(
    '::-p-xpath(//*[@id="property_value"])',
    data.property_value.toString().replace(".", ",")
  );
  await page.type(
    '::-p-xpath(//*[@id="input_value"])',
    data.input_value.toString().replace(".", ",")
  );
  await page.type('::-p-xpath(//*[@id="ds-field-birthdate"])', data.birth_date);

  const financingTermField = await getByXpath(
    page,
    "/html/body/div[1]/div[1]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[6]/div[1]/div/input"
  );
  await page.evaluate((el) => {
    el.value = '';
  }, financingTermField);
  await page.type(
    "::-p-xpath(/html/body/div[1]/div[1]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[6]/div[1]/div/input)",
    data.financing_term.toString()
  );

  await clickElementByXpath(page, '//*[@id="ds-field-has_property"]');
  if (data.has_property) {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-has_property_0"]'
    );
  } else {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-has_property_1"]'
    );
  }

  await clickElementByXpath(page, '//*[@id="ds-field-time_acquire_property"]');
  if (data.time_acquire_property === "up_to_1_month") {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-time_acquire_property_0"]'
    );
  } else if (data.time_acquire_property === "up_to_3_months") {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-time_acquire_property_1"]'
    );
  } else if (data.time_acquire_property === "more_than_3_months") {
    await clickElementByXpath(
      page,
      '//*[@id="option-ds-field-time_acquire_property_2"]'
    );
  }

  if(data.insurance_company === 'itau') {
    const insuranceCompany = await getByXpath(page, '//*[@id="gatsby-focus-wrapper"]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[10]/div[1]/label');

    await page.evaluate((el) => el.click(), insuranceCompany);
  } else {
    const insuranceCompany = await getByXpath(page, '//*[@id="gatsby-focus-wrapper"]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[10]/div[2]/label');

    await page.evaluate((el) => el.click(), insuranceCompany);
  }

  const error = await page.$$("#ds-error-message-input_value");
  if (error.length > 0) {
    const errorMessage = await page.evaluate((el) => el.textContent?.trim(), error[0]);
    throw new Error(errorMessage);
  }

  await sleep(2000);

  const buttonSimulate = await getByXpath(
    page,
    '//*[@id="gatsby-focus-wrapper"]/main/div[2]/div[2]/div/div/div[2]/div/div/form/div[11]/button[2]'
  );

  await page.evaluate((el) => el.click(), buttonSimulate);
}
