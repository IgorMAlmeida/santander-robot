export default async function loginBradescoImovel(page) {
    const username = process.env.BRADESCO_IMOVEL_LOGIN || 'DCM-CREDFRANCO';
    const password = process.env.BRADESCO_IMOVEL_PASS_LOGIN || 'cRED@2025';

    await page.waitForSelector('#textfield-1055-inputEl', { timeout: 10000 });
    await page.type('#textfield-1055-inputEl', username);
    await page.type('#textfield-1056-inputEl', password);

    try {
      await page.waitForSelector('#button-1062-btnInnerEl', { timeout: 10000 });
    
      let navigationDetected = false;
      page.on('framenavigated', frame => {
        const url = frame.url();
      
        if (url.includes('https://creditoimobiliario.daycoval.com.br/')) {
          console.log("🌐 Navegação detectada para a home:", url);
          navigationDetected = true;
        }
      });

      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 55000 });
      await page.click('#button-1062-btnInnerEl');    
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