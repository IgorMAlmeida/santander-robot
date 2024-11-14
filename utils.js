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
            throw new Error('Element not found');
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
