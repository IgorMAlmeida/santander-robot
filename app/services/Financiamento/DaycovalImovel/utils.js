/**
 * Clica no combobox e seleciona uma opção com texto exato.
 * @param {object} page - Instância do Puppeteer.
 * @param {number} index - Seletor do combobox (ex: '#aejs-combobox-1257-trigger-picker[1]').
 * @param {string} optionText - Texto exato da opção a ser selecionada (ex: 'Originação').
 */
export async function selectComboOptionByText(page, index, optionText) {
    // Clica no combobox    
    const comboboxes = await page.$$('div[id*="aejs-combobox"][id$="trigger-picker"]');

    if (!comboboxes[index]) {
        throw new Error(`❌ Combobox de índice ${index} não encontrado.`);
      }

    await comboboxes[index].click();
  
    // Aguarda a lista de opções aparecer
    await page.waitForSelector('li.x-boundlist-item', { visible: true });
  
    // Seleciona a opção com o texto desejado
    await page.evaluate((text) => {
      const options = Array.from(document.querySelectorAll('li.x-boundlist-item'));
      console.log(options);
      const option = options.find(el => el.textContent.trim() === text);
      if (option) {
        option.click();
      } else {
        console.warn(`Opção com texto "${text}" não encontrada.`);
      }
    }, optionText);
  }
  
  export async function fillComboInputAndSelect(page, index, text) {
    // Seleciona todos os inputs do combobox
    const inputs = await page.$$('input[id*="aejs-combobox"][id$="inputEl"]');
  
    if (!inputs[index]) {
      throw new Error(`❌ Input do combobox de índice ${index} não encontrado.`);
    }
  
    // Foca e digita no input
    await inputs[index].click({ clickCount: 3 }); // Seleciona o conteúdo anterior
    await inputs[index].press('Backspace');
    await inputs[index].type(text, { delay: 50 });
    
    // Clica diretamente na sugestão correspondente
    await page.evaluate((text) => {
    const items = Array.from(document.querySelectorAll('li.x-boundlist-item'))
        .filter(el => el.offsetParent !== null); // Apenas os visíveis
    
    const match = items.find(el => el.textContent.trim() === text);
    if (match) {
        match.scrollIntoView({ block: 'center' });
        match.click();
    } else {
        console.warn(`❌ Opção com texto "${text}" não encontrada.`);
    }
    }, text);
      
  }

  export async function fillInputAndSelect(page, name, text) {
    // Seleciona todos os inputs do combobox
    const inputs = await page.$(name);
    
    // Foca e digita no input
    await inputs.click({ clickCount: 3 }); // Seleciona o conteúdo anterior
    await inputs.press('Backspace');
    await inputs.type(text, { delay: 50 });
    
    // Clica diretamente na sugestão correspondente
    await page.evaluate((text) => {
    const items = Array.from(document.querySelectorAll('li.x-boundlist-item'))
        .filter(el => el.offsetParent !== null); // Apenas os visíveis
    
    const match = items.find(el => el.textContent.trim() === text);
    if (match) {
        match.scrollIntoView({ block: 'center' });
        match.click();
    } else {
        console.warn(`❌ Opção com texto "${text}" não encontrada.`);
    }
    }, text);
      
  }

  export async function clickButtonByText(page, text) {
    const [button] = await page.$x(`//span[contains(@class, 'x-btn-inner') and normalize-space(text())='${text}']`);
    if (button) {
      await button.click();
      console.log(`✅ Botão "${text}" clicado.`);
    } else {
      console.warn(`❌ Botão "${text}" não encontrado.`);
    }
  }