import puppeteer from "puppeteer-extra";

export default async function consult(data) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
      slowMo: 50,
    });
  
    const pagesBefore = await browser.pages();
    const page = pagesBefore[0];

    let response = "Teste";
    const username = process.env.ITAU_IMOVEL_LOGIN || 'juliana.soares@credifranco.com.br';
    const password = process.env.ITAU_IMOVEL_PASS_LOGIN || 'Sucesso@2024';
    const ITAU_IMOVEL_URL = (process.env.ITAU_IMOVEL_URL || 'https://plataformaitauimoveis.cloud.itau.com.br/Portal/').replace(/"/g, '').trim();
    console.log("🔗 Acessando:", ITAU_IMOVEL_URL);

    await page.goto(ITAU_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada");

    await page.waitForSelector('input[name="txtUsuario"]', { timeout: 10000 });
    console.log("🟢 Campo de e-mail localizado");
    await page.type('input[name="txtUsuario"]', username);

    await page.waitForSelector('input[name="txtSenha"]', { timeout: 10000 });
    console.log("🟢 Campo de senha localizado");
    await page.type('input[name="txtSenha"]', password);

    try {
      await page.waitForSelector('#btnEntrar', { timeout: 10000 });
      console.log("🟢 Botão de login localizado");
    
      let navigationDetected = false;
      page.on('framenavigated', frame => {
        const url = frame.url();
        if (url.includes('/Portal/pages')) {
          console.log("🌐 Navegação detectada para:", url);
          navigationDetected = true;
        }
      });

      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 55000 });
      await page.click('#btnEntrar');
      console.log("🔐 Login enviado.");
    
      await navigationPromise;
      console.log("🔄 Página redirecionada após login.");
    } catch (navErr) {
      const erroLogin = await page.$('.erroLogin, .mensagemErro, .alert-danger');
      if (erroLogin) {
        const mensagem = await page.evaluate(el => el.innerText, erroLogin);
        throw new Error(`❌ Falha no login: ${mensagem}`);
      } else {
        throw new Error(`❌ Login possivelmente falhou: sem redirecionamento detectado.`);
      }
    }

    try {
      await page.waitForSelector('#btnOk0', { visible: true, timeout: 30000 });
      await page.click('#btnOk0');
      console.log("✔️ Botão #btnOk0 clicado com sucesso.");
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log("⚠️ Botão #btnOk0 não apareceu dentro do tempo esperado.");
      } else if (error.message.includes('Target closed')) {
        console.log("❌ A aba foi fechada ou recarregada antes de encontrar o botão #btnOk0.");
      } else {
        console.log("⚠️ Erro ao tentar clicar no botão #btnOk0:", error.message);
      }
    }
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('.fa-search');
        await page.waitForSelector('#numeroProposta', { visible: true });
        await page.click('#numeroProposta');
        await page.type('#numeroProposta', data);
        page.click('#btnConsultarProposta');

        await new Promise(resolve => setTimeout(resolve, 10000));
        let statusProposta= 'em_analise_credito';
        let spanStatusProposta= 'em_analise_credito';
        let motivoRecusa= 'A proposta está em análise de crédito. Tente novamente mais tarde.';
        const currentURL = page.url();
        if (currentURL.includes('/erro/Error500.html')) {
            console.log(`⚠️ Proposta ${data} em análise de crédito (URL de erro 500 detectada).`);
            response = {
                Proposta: data,
                StatusFaseProposta: statusProposta,
                Status: spanStatusProposta,
                Motivo: motivoRecusa,
            };
            
            await browser.close();
            return {
                status: true,
                response,
            };
        }

        try{
            statusProposta = await page.$eval('#spanFaseStatusProposta', el => el.textContent.trim());
            spanStatusProposta = await page.$eval('#spanStatusProposta', el => el.textContent.trim());
            motivoRecusa = await page.$eval('#spanMotivoRecusa', el => el.textContent.trim());
            console.log('Status da proposta:', statusProposta, spanStatusProposta, motivoRecusa);  
        } catch (error) {
            console.error('❌ Erro ao pegar status:', error);
        } 

        response = {
            Proposta: data,
            StatusFaseProposta: statusProposta,
            Status: spanStatusProposta,
            Motivo: motivoRecusa
        };
        await page.click('#logoff-action');
    } catch (error) {
        console.error('❌ Erro ao preencher os campos:', error);
    }

    await browser.close();
    return {
      status: true,
      response,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
      details: error.details || undefined,
    };
  }
}
