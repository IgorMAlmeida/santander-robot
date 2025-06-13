export async function getByXpath (page, xpath) {
    const element = await page.$(`::-p-xpath(${xpath})`);
    return element;
};

export async function clickElementByXpath (page, xpath) {
    const button = await page.waitForSelector(`::-p-xpath(${xpath})`);
    await button.click();
};

export async function elementHover (page, xpath) {
    await page.hover(`::-p-xpath(${xpath})`);
};

export async function sleep (timming) {
    await new Promise(resolve => setTimeout(resolve, timming));
};

export async function getElementText(page, selector) {
    return page.$eval(selector, span => span.textContent);
}

export async function checkElement(page, selector) {
    try {
        const element = await getByXpath(page, selector);

        if(!element) {
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

export async function getLinkByXPath(page, xpath, options = {}) {
    const { timeout = 10000, required = true } = options;
    
    try {
        await page.waitForXPath(xpath, { visible: true, timeout });
        
        const elements = await page.$x(xpath);
        
        if (elements.length === 0) {
            if (required) {
                throw new Error(`Elemento não encontrado com XPath: ${xpath}`);
            }
            return null;
        }
        
        const url = await page.evaluate(element => {
            if (element.hasAttribute('href')) {
                return element.getAttribute('href');
            }
            
            if (element.hasAttribute('onclick')) {
                const onclick = element.getAttribute('onclick');
                const urlMatches = onclick.match(/(window\.open|location\.href)\s*\(\s*['"]([^'"]+)['"]/);
                if (urlMatches && urlMatches[2]) {
                    return urlMatches[2];
                }
            }
            
            return null;
        }, elements[0]);
        
        if (!url && required) {
            throw new Error('Elemento encontrado mas não contém link válido');
        }
        
        return url;
        
    } catch (error) {
        if (!required) {
            console.warn(`getLinkByXPath opcional falhou: ${error.message}`);
            return null;
        }
        throw new Error(`Falha ao extrair link por XPath: ${error.message}`);
    }
}
export async function awaitElement(page, selector) {
    try{
        const element = await page.waitForSelector(`xpath=${selector}`, { timeout: 1000 });

        return {
            status: true,
            data: element
        }
    }catch (error) {
        return {
            status: false,
            data: error
        }
    }
}

export async function getElementTextByXpath(page, xpath) {
    const element = await page.$(`::-p-xpath(${xpath})`);
    return element.evaluate(el => el.textContent);
}

export async function checkElementAndText(page, selector) {
    try {
        const element = await page.$(`::-p-xpath(${selector})`);

        if(!element) {
            throw new Error('Element not found for selector: ' + selector);
        }

        const textoElemento = await element.evaluate(el => el.textContent);
        return { status: true, text: textoElemento };        
    } catch (error) {
        return {status: false, text: error };
    }
}

export function replaceValues(value) {
    if (value.includes('.')) {
        let newValue = value.replace(/\./g, '');
        return newValue.replace(/,/g, '.');
    }
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