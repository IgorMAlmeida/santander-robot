const ufToCode = {
    "AC": "11",
    "AL": "36",
    "AP": "19",
    "AM": "13",
    "BA": "39",
    "CE": "32",
    "DF": "96",
    "ES": "52",
    "GO": "93",
    "MA": "30",
    "MT": "90",
    "MS": "91",
    "MG": "50",
    "PA": "17",
    "PB": "34",
    "PR": "73",
    "PE": "35",
    "PI": "31",
    "RJ": "54",
    "RN": "33",
    "RS": "77",
    "RO": "10",
    "RR": "15",
    "SC": "75",
    "SP": "58",
    "SE": "38",
    "TO": "97"
};


export async function getUFCode(uf) {
return ufToCode[uf.toUpperCase()] || '';
}

export async function typeInput(page, selector, value) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector, { clickCount: 3 });
    await page.type(selector, value, { delay: 30 });
}

export async function selectInput(page, selector, value) {
    await page.waitForSelector(selector, { visible: true });
    await page.select(selector, value);
}

export async function selectClick(page, selector, timeout = 5000) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    await new Promise(resolve => setTimeout(resolve, timeout));
}

export async function htmlConsole(page) {
    const html = await page.content();
    console.log(html);
}

export async function selectAndPostback(page, selector, value, timeout = 5000) {
    await page.waitForSelector(selector, { visible: true });
    await page.select(selector, value);
    await page.evaluate((sel, val) => {
        __doPostBack(sel.replace('#', ''), val);
    }, selector, value);
    await new Promise(resolve => setTimeout(resolve, timeout));
}

export async function clickAndPostback(page, selector, value, timeout = 5000) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    await page.type(selector, value);
    await page.evaluate((sel, val) => {
        __doPostBack(sel.replace('#', ''), val);
    }, selector, value);
    await new Promise(resolve => setTimeout(resolve, timeout));
}

export async function typeAndSubmit(page, inputSelector, value, submitButtonSelector, timeout = 3000) {
    await page.waitForSelector(inputSelector, { visible: true });
    await page.click(inputSelector, { clickCount: 3 });
    await page.type(inputSelector, value, { delay: 20 });
    
    await page.waitForSelector(submitButtonSelector, { visible: true });
    await page.click(submitButtonSelector);

    await new Promise(resolve => setTimeout(resolve, timeout));
}

export async function typeAndSubmitWithValidation(page, inputSelector, value, submitButtonSelector, errorSelectors = [], timeout = 3000) {
    await typeAndSubmit(page, inputSelector, value, submitButtonSelector, timeout);

    for (const selector of errorSelectors) {
        const isVisible = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            return el && getComputedStyle(el).display !== 'none' && el.innerText.trim() !== '';
        }, selector);

        if (isVisible) {
            const message = await page.$eval(selector, el => el.innerText.trim());
            throw new Error(`❌ Erro de validação detectado: "${message}" (${selector})`);
        }
    }

    console.log("✅ Campo preenchido e validado com sucesso:", inputSelector);
}

export async function typeAndSubmitWithMaxCheck(page, inputSelector, value, buttonSelector, spanSelector, timeout = 3000) {
    // Converte o valor recebido para número (caso seja string no formato brasileiro)
    let valorFinal = await convertToNumber(value);

    // 1. Captura o texto do span
    const textoSpan = await page.$eval(spanSelector, el => el.innerText);
    const match = textoSpan.match(/R\$ ?([\d.,]+)/i);

    if (!match) {
        throw new Error(`❌ Não foi possível identificar o valor máximo no span (${spanSelector}).`);
    }

    const valorMaximo = await convertToNumber(match[1]);

    if (valorFinal > valorMaximo) {
        console.warn(`⚠️ Valor (${valorFinal}) excede o máximo (${valorMaximo}). Usando o valor máximo.`);
        valorFinal = valorMaximo;
    }

    await typeAndSubmit(page,inputSelector, valorFinal.toFixed(2).replace('.', ','), buttonSelector, timeout);

    console.log(`✅ Campo ${inputSelector} preenchido com: R$ ${valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

export async function typeAndSubmitIntegerWithMaxCheck(page, inputSelector, value, buttonSelector, spanSelector, timeout = 3000) {
    const textoSpan = await page.$eval(spanSelector, el => el.innerText);
    const match = textoSpan.match(/(\d+)\s*meses/i);

    if (!match) {
        throw new Error(`❌ Não foi possível identificar o valor máximo no span (${spanSelector}).`);
    }

    const valorMaximo = parseInt(match[1]);
    let valorFinal = parseInt(value);

    if (valorFinal > valorMaximo) {
        console.warn(`⚠️ Valor (${valorFinal}) excede o máximo (${valorMaximo}). Usando o valor máximo.`);
        valorFinal = valorMaximo;
    }
    valorFinal = valorFinal.toString();

    await typeAndSubmit(page,inputSelector, valorFinal, buttonSelector, timeout);

    console.log(`✅ Campo ${inputSelector} preenchido com: ${valorFinal}`);
}

export async function convertToNumber(valueString) {
    // Remove os separadores de milhar (pontos) e converte para número
    const cleanValue = valueString.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
}

export async function extractSimulationResult(page) {
    const getText = async (selector) => {
      const element = await page.$(selector);
      if (!element) return null;
      const text = await page.evaluate(el => el.innerText.trim(), element);
      return text;
    };
  
    const result = {
      valorImovel: await getText('#lblValorImovel'),
      valorFinanciamento: await getText('#lblValorFinanciamento_Adquirir'),
      valorDespesas: await getText('#lblValorDespesasFinanciadas'),
      prazo: await getText('#lblPrazo_Adquirir'),
      sistemaAmortizacao: await getText('#lblSistemaAmortizacao_Adquirir'),
      formaPagamento: await getText('#lblResultadoFormaPagamento'),
      taxaJurosEfetivaAno: await getText('#lblTaxaJurosEfetivaAno_Adquirir'),
      valorPrestacaoMensal: await getText('#lblValorPrestacaoMensal_Adquirir'),
      rendaLiquidaMinima: await getText('#lblRendaLiquidaMinima_Adquirir'),
      cesh: await getText('#lblCESHAno_Adquirir'),
      cet: await getText('#lblCETAno_Adquirir'),
    };
  
    console.log("📋 Resultado da Simulação:", result);
    return result;
}

export async function clickAndSavePdfBase64(page) {

    page.on('request', async (req) => {
        const url = req.url();
        if (url.includes('SimulacaoImpressao.aspx')) {
          console.log('➡️ Nova aba detectada:', url);
      
          // Abra a nova página manualmente
          const printPage = await page.context().newPage();
          await printPage.goto(url, { waitUntil: 'load' });
            
          console.log('Página aberta com sucesso!');
        }
      });
      
    await page.click('#lnkImprimir'); 
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForSelector('a.btnImprimir', { visible: true });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    const file64 = pdfBuffer.toString('base64');
    console.log('📎 PDF capturado em Base64');
    await page.bringToFront();

    return file64;
  }
  