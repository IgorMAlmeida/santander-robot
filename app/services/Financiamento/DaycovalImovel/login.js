export default async function loginDaycovalImovel(page) {
    const username = process.env.DAYCOVAL_IMOVEL_LOGIN || 'DCM-CREDFRANCO';
    const password = process.env.DAYCOVAL_IMOVEL_PASS_LOGIN || 'cRED@2025';

    await new Promise(resolve => setTimeout(resolve, 500));
    await page.waitForSelector('input[name="name"]');
    await page.type('input[name="name"]', username);

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', password);
    
    try {
      await page.waitForSelector('.x-btn-inner'); // Aguarda qualquer botão com essa classe
      const buttons = await page.$$('.x-btn-inner');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.trim() === 'Login') {
          await btn.click(); // Clica no botão com o texto "Login"
          break;
        }
      }
      console.log("🔄 Página redirecionada após login.");
    } catch (navErr) {
      console.log(navErr);
      const erroLogin = await page.$('.erroLogin, .mensagemErro, .alert-danger');
      if (erroLogin) {
        const mensagem = await page.evaluate(el => el.innerText, erroLogin);
        throw new Error(`❌ Falha no login: ${mensagem}`);
      } else {
        throw new Error(`❌ Login possivelmente falhou: sem redirecionamento detectado.`);
      }
    }    
}