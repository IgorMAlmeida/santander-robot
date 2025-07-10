export default async function loginItauImovel(page) {
  const username = process.env.ITAU_IMOVEL_LOGIN;
  const password = process.env.ITAU_IMOVEL_PASS_LOGIN;

  await page.waitForSelector('input[name="txtUsuario"]', { timeout: 10000 });
  await page.type('input[name="txtUsuario"]', username);
  await page.type('input[name="txtSenha"]', password);

    try {
      await page.waitForSelector('#btnEntrar', { timeout: 10000 });
    
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
      
      try {
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll('button')).some(
            btn => btn.textContent.trim().toUpperCase() === 'OK'
          );
        }, { timeout: 10000 });
        
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const okButton = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'OK');
          if (okButton) {
            okButton.click();
          }
        });
        console.log("✅ Botão com texto 'OK' clicado.");

      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.log("⚠️ Botão não apareceu dentro do tempo esperado.");
        } else if (error.message.includes('Target closed')) {
          console.log("❌ A aba foi fechada ou recarregada antes de encontrar o botão #btnOk0.");
        } else {
          console.log("⚠️ Erro ao tentar clicar no botão #btnOk0:", error.message);
        }
      }

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
}