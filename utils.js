export async function getByXpath(page, xpath) {
  const element = await page.$(`::-p-xpath(${xpath})`);
  return element;
};

export async function clickElementByXpath(page, xpath, timeout = 5000, waitUntil = 'domcontentloaded') {
  const button = await page.waitForSelector(`::-p-xpath(${xpath})`, { timeout, waitUntil });
  await button.click();
};

export async function clickCheckboxByValue(page, value, timeout = 5000, waitUntil = 'domcontentloaded') {
  const xpath = `//input[@type='checkbox' and @value='${value}']`;
  const checkbox = await page.waitForSelector(`::-p-xpath(${xpath})`, { timeout, waitUntil });
  await checkbox.click();
}

export async function selectOptionByXpath(page, xpath, value) {
  await page.evaluate(() => {
    const select = document.querySelector(
      `::-p-xpath(${xpath})`
    );
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

export async function pasteValueByXpath(page, xpath, value) {
  const inputHandle = await getByXpath(page, xpath);
  await page.evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, inputHandle, value);
}

export async function clickElementByXpathWithoutWait(page, xpath) {
  await page.click(`::-p-xpath(${xpath})`);
};

export async function elementHover(page, xpath) {
  await page.hover(`::-p-xpath(${xpath})`);
};

export async function sleep(timming) {
  await new Promise(resolve => setTimeout(resolve, timming));
};

export async function getElementText(page, selector) {
  return page.$eval(selector, span => span.textContent);
}

export async function checkElement(page, selector) {
  try {
    const element = await getByXpath(page, selector);

    if (!element) {
      throw new Error('Element not found');
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function getElementClass(page, selector) {
  const element = await getByXpath(page, selector);
  return element.evaluate(el => el.className);
}

export async function blockUnnecessaryRequests(page) {
  await page.setRequestInterception(true);
  page.on('request', req => {
    const resourceType = req.resourceType();
    if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
      req.abort();
    } else {
      req.continue();
    }
  });
}

export async function awaitElement(page, selector) {
  try {
    const element = await page.waitForSelector(`xpath=${selector}`, { timeout: 1000 });

    return {
      status: true,
      data: element
    }
  } catch (error) {
    return {
      status: false,
      data: error
    }
  }
}

export async function getElementTextByXpath(page, xpath, timeout = 5000) {
  const element = await getElementByXpath(page, xpath, timeout);
  return element.evaluate(el => el.textContent);
}

export async function checkElementAndText(page, selector) {
  try {
    const element = await page.$(`::-p-xpath(${selector})`);

    if (!element) {
      throw new Error('Element not found for selector: ' + selector);
    }

    const textoElemento = await element.evaluate(el => el.textContent);
    return { status: true, text: textoElemento };
  } catch (error) {
    return { status: false, text: error };
  }
}

export async function checkElementAndValue(page, selector) {
  try {
    const element = await page.$(`::-p-xpath(${selector})`);

    if (!element) {
      throw new Error('Element not found for selector: ' + selector);
    }

    const textoElemento = await element.evaluate(el => el.value);
    return { status: true, text: textoElemento };
  } catch (error) {
    return { status: false, text: error };
  }
}

export function replaceValues(value) {
  if (value.includes('.')) {
    let newValue = value.replace(/\./g, '');
    return newValue.replace(/,/g, '.');
  }
}

export async function typeByXpath(page, xpath, value, timeout = 5000) {
  const element = await page.waitForSelector(`::-p-xpath(${xpath})`, { timeout });
  await element.focus();
  await element.evaluate(el => { el.value = ''; });
  await element.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })));

  for (const char of value) {
    await element.type(char, { delay: 100 });
    await sleep(50);
  }

  await element.evaluate(el => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export async function getElementByXpath(page, xpath, timeout = 5000) {
  const element = await page.waitForSelector(`::-p-xpath(${xpath})`, { timeout });
  return element;
}
export async function getAltTextByXPath(page, xpath) {
  try {
    const elements = await page.$$(`xpath/${xpath}`);

    if (elements.length > 0) {
      return await page.evaluate(img => img.getAttribute('alt'), elements[0]);
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar elemento com XPath ${xpath}:`, error);
    return null;
  }
}
export async function getLinkByXPath(page, xpath) {
  const elements = await page.$$(`xpath/${xpath}`);
  const element = elements[0];
  if (!element) return null;

  return page.evaluate(el => {
    if (el.href) return el.href;

    if (el.onclick) {
      const matches = el.onclick.toString().match(
        /(?:location\.href\s*=\s*['"]([^'"]+)['"]|\.href\s*\(\s*['"]([^'"]+)['"])/i
      );
      if (matches) return matches[1] || matches[2];
    }

    return el.dataset.href || el.dataset.url || null;
  }, element);
}


export async function typeCPFWithMask(page, xpath, cpf) {
  await page.evaluate((xpath) => {
    const input = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, xpath);

  const formattedCPF = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  await page.evaluate((xpath, value) => {
    const input = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    input.value = value;
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }, xpath, formattedCPF);

  const insertedValue = await page.evaluate((xpath) => {
    return document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue.value;
  }, xpath);

  if (insertedValue !== formattedCPF) {
    throw new Error(`Falha na formatação do CPF. Esperado: ${formattedCPF}, Obtido: ${insertedValue}`);
  }
}

export async function getTableCertificatesByXpath(page, containerXpath) {
  const certificates = [];

  const rowsXpath = `${containerXpath}//table/tbody/tr`;

  const paginationInfoXpath = `/html/body/app-root/app-resultado-consulta/div/div/app-consulta-cpf/div/div[1]/div[2]/app-tabela-certificados/div/mat-paginator/div/div/div[2]/div`;
  const nextPageButtonSelector = 'button.mat-mdc-paginator-navigation-next';
  await page.waitForSelector(nextPageButtonSelector, { timeout: 5000 });

  while (true) {
    await page.waitForSelector(`xpath/${containerXpath}`, { timeout: 5000 });
    await page.waitForSelector(`xpath/${rowsXpath}`);

    const rows = await page.$$(`xpath/${rowsXpath}`);

    for (const row of rows) {
      const cells = await row.$$('td');
      if (cells.length < 8) continue;

      const certificadora = await cells[0].evaluate(el => el.textContent.trim());
      const nomeAgente = await cells[1].evaluate(el => el.textContent.trim());
      const tipoCertificado = await cells[2].evaluate(el => el.textContent.trim());
      const certificado = await cells[3].evaluate(el => el.textContent.trim());
      const numeroCertificado = await cells[4].evaluate(el => el.textContent.trim());
      const dataExame = await cells[5].evaluate(el => el.textContent.trim());
      const dataValidade = await cells[6].evaluate(el => el.textContent.trim());

      const spans = await cells[7].$$('span');
      const situacao = spans[1] ? await spans[1].evaluate(el => el.textContent.trim()) : '';

      certificates.push({
        Certificadora: certificadora,
        NomeAgente: nomeAgente,
        TipoCertificado: tipoCertificado,
        Certificado: certificado,
        NumeroCertificado: numeroCertificado,
        DataExame: dataExame,
        DataValidade: dataValidade,
        Situacao: situacao
      });
    }

    const paginationElems = await page.$$(`xpath/${paginationInfoXpath}`);
    if (paginationElems.length === 0) break;

    const paginationText = await paginationElems[0].evaluate(el => el.textContent.trim());
    const match = paginationText.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!match) break;

    const currentEnd = Number(match[2]);
    const total = Number(match[3]);

    if (currentEnd >= total) break;

    const nextButtonDisabled = await page.$eval(nextPageButtonSelector, btn => btn.disabled);
    if (nextButtonDisabled) break;

    await Promise.all([
      page.click(nextPageButtonSelector),
      page.waitForSelector(`xpath/${rowsXpath}`, { timeout: 10000 })
    ]);
  }

  console.log('Total certificados coletados:', certificates.length);
  console.log('Certificados coletados:', certificates);
  return certificates;
}



export async function getUsersTablePan(page, xpathTabela) {
  await page.waitForSelector(`::-p-xpath(${xpathTabela})`, { timeout: 5000 });

  const rows = await page.$$(`::-p-xpath(${xpathTabela}//tbody/tr)`);
  const data = [];

  for (const row of rows) {
    const cells = await row.$$('td');
    if (cells.length < 5) continue;

    const promoter = await cells[0].evaluate(el => el.textContent?.trim());
    const cpf_user = await cells[1].evaluate(el => el.textContent?.trim());
    const name_user = await cells[2].evaluate(el => el.textContent?.trim());
    const access_prof = await cells[3].evaluate(el => el.textContent?.trim());
    const status = await cells[4].evaluate(el => el.textContent?.trim());

    data.push({
      PromotoraMaster: promoter,
      CPFUsuario: cpf_user,
      NomeUsuario: name_user,
      PerfilDeAcesso: access_prof,
      Status: status,
    });
  }

  return data;
}

export async function toISODate(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}