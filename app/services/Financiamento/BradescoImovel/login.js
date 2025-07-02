export default async function loginBradescoImovel(page) {
    const username = process.env.BRADESCO_IMOVEL_LOGIN;
    const password = process.env.BRADESCO_IMOVEL_PASS_LOGIN;

    await page.waitForSelector('#txtLogin', { timeout: 10000 });
    await page.type('#txtLogin', username);
    await page.type('#txtSenha', password);

    try {
      await page.waitForSelector('#btnAcessar', { timeout: 10000 });
    
      let navigationDetected = false;
      page.on('framenavigated', frame => {
        const url = frame.url();
      
        if (url.includes('/wsImoveis/AreaRestrita/Conteudo/Home.aspx')) {
          console.log("🌐 Navegação detectada para a home:", url);
          navigationDetected = true;
        }
      });

      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 55000 });
      await page.click('#btnAcessar');    
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