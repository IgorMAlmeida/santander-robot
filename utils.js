export async function getByXpath (page, xpath) {

    const element = await page.$(`::-p-xpath(${xpath})`);
    return element;
};

export async function clickElementByXpath (page, xpath) {

    await page.waitForSelector(`::-p-xpath(${xpath})`);
    await page.click(`::-p-xpath(${xpath})`);

};

export async function elementHover (page, xpath) {

    await page.hover(`::-p-xpath(${xpath})`);

};