import loginDaycovalImovel from "./login.js";
import { selectComboOptionByText, fillComboInputAndSelect, fillInputAndSelect } from "./utils.js";
import validate from "./validate.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

export default async function simulation(data) {
  try {
    let response = "Teste";
    const selectors = ['.bootbox:nth-child(14) .btn', '.in .btn', '.btn-warning'];
    const { isValid, errors } = validate(data);

    if (!isValid) {
      const error = new Error("Existem dados inválidos ou faltando.");
      error.details = errors;
      throw error;
    }

    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
      slowMo: 50,
    });
  
    const pagesBefore = await browser.pages();
    const page = pagesBefore[0];
    const DAYCOVAL_IMOVEL_URL = (process.env.DAYCOVAL_IMOVEL_URL || 'https://creditoimobiliario.daycoval.com.br/').replace(/"/g, '').trim();

    await page.goto(DAYCOVAL_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada: ", DAYCOVAL_IMOVEL_URL);

    await loginDaycovalImovel(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('span'));
        const target = buttons.find(el => el.textContent.trim() === 'Originação');
        if (target) target.click();
      });
      console.log("Entrou no menu Originação.");

      await new Promise(resolve => setTimeout(resolve, 500));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('span'));
        const target = buttons.find(el => el.textContent.trim() === 'Realizar nova simulação');
        if (target) target.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (navErr) {
      throw new Error(`❌ Falha ao acessar menu de digitação.`);
    }

    let label1 = 'CGI';
    let label2 = 'CGI - COMERCIAL / RESIDENCIAL/MISTO';
    let label3 = 'CGI PRÉ PRICE';

    if (data.type_produt == "propertyfinancing") {
      label1 = 'AQUISIÇÃO IMOBILIÁRIA';
      if (data.type_property == "1") {
        label2 = 'AQUISIÇÃO RESIDENCIAL';
        label3 = 'AQUISIÇÃO RESIDENCIAL PRÉ PRICE';
      } else {
        label2 = 'AQUISIÇÃO COMERCIAL/MISTO'
        label3 = 'AQUISIÇÃO COMERCIAL PRÉ PRICE';
      }
    }

    try {
      console.log("Preenchendo dados iniciais");
      console.log("Preenchendo com: " + label1 + ' - ' + label2 + ' - ' + label3);
      await selectComboOptionByText(page, 0, label1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fillComboInputAndSelect(page, 1, label2);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fillComboInputAndSelect(page, 2, label3);
    } catch (navErr) {
      throw new Error(`❌ Falha ao preencher campos iniciais.`);
    }

    try {
      console.log("Preenchendo valores iniciais");
      await page.waitForSelector('input[name="VA_IMOVEL"]');
      await page.type('input[name="VA_IMOVEL"]', data.property_value);
      await page.waitForSelector('input[name="VA_FINANCIAMENTO"]');
      await page.type('input[name="VA_FINANCIAMENTO"]', data.input_value);
      await fillInputAndSelect(page, 'input[name="CO_SEGURADORA"]', 'ZURICH');
      await page.waitForSelector('input[name="DT_NASCIMENTO"]');
      await page.type('input[name="DT_NASCIMENTO"]', data.birth_date);
      await page.waitForSelector('input[name="P1_VA_RENDA"]');
      await page.type('input[name="P1_VA_RENDA"]', data.income_value);
    } catch (navErr) {
      throw new Error(`❌ Falha ao preencher valores iniciais.`);
    }

    try {
      await fillInputAndSelect(page, 'input[name="NU_PRAZO_CARENCIA_AMORTIZACAO"]', '1');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.waitForSelector('.x-btn'); // Aguarda qualquer botão com essa classe
      const buttons = await page.$$('.x-btn');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.trim() === 'Prosseguir') {
          await btn.click(); // Clica no botão com o texto "Login"
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.waitForSelector('.x-btn-inner'); // Aguarda qualquer botão com essa classe
      const prosseguir = await page.$$('.x-btn-inner');
      
      for (const btn of prosseguir) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.trim() === 'Prosseguir') {
          await btn.click(); // Clica no botão com o texto "Login"
          break;
        }
      }
    } catch (navErr) {
      throw new Error(`❌ Falha ao preencher primeira e segunda parte.`);
    }
    
    try {
      await page.waitForSelector('input[name="NU_MESES_PRAZO"]');
      await page.click('input[name="NU_MESES_PRAZO"]',{ clickCount: 3 }); // Seleciona o conteúdo anterior
      await page.type('input[name="NU_MESES_PRAZO"]', String(data.financing_term), { delay: 50 });

      await new Promise(resolve => setTimeout(resolve, 100));
      await page.waitForSelector('.x-btn');
      const buttons = await page.$$('.x-btn');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.trim() === 'Prosseguir') {
          await btn.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));

      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const botao = spans.find(el => el.textContent.includes('Gravar Proposta'));
        if (botao) {
          console.log("Clicou");
          botao.click();
        }
      });      

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (navErr) {
      console.log(navErr);
      throw new Error(`❌ Falha ao gravar proposta.`);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      await fillInputAndSelect(page, 'input[name="CO_MOTIVO_EMPRESTIMO"]', 'Investimento Empresarial');

      await page.waitForSelector('input[name="NU_CPF_AUX"]');
      await page.type('input[name="NU_CPF_AUX"]', data.cpf);
      await page.waitForSelector('input[name="NO_PESSOA"]');
      await page.type('input[name="NO_PESSOA"]', data.name);
      await page.waitForSelector('input[name="NO_EMAIL"]');
      await page.type('input[name="NO_EMAIL"]', data.email);
      
      const clicou = await page.$$eval('span.x-btn-inner', (spans) => {
        const botoes = spans.filter(el => el.textContent.includes('Gravar Proposta'));
        if (botoes.length >= 2) {
          botoes[1].click();
          return true;
        }
        return false;
      });
      
      if (!clicou) {
        throw new Error('❌ Segundo botão "Gravar Proposta" não encontrado ou não clicável.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (navErr) {
      throw new Error(`❌ Falha ao gravar dados da proposta.`);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.waitForSelector('.x-btn-inner');
      const buttons = await page.$$('.x-btn-inner');
      
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.trim() === 'Confirma') {
          await btn.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 6000));

    } catch (navErr) {
      throw new Error(`❌ Não abriu modal de proposta existente x-btn-inner.`);
    }

    try {
      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const botao = spans.find(el => el.textContent.trim() === 'Cadastro do Proponente');
        if (botao) {
          botao.click();
          console.log('✅ Clicou no Cadastro do Proponente');
        } else {
          console.warn('❌ Botão "Cadastro do Proponente" não encontrado');
        }
      });

      await new Promise(resolve => setTimeout(resolve, 6000));

      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const botao = spans.find(el => el.textContent.trim() === 'Alterar');
        if (botao) {
          botao.click();
          console.log('✅ Clicou no Alterar');
        } else {
          console.warn('❌ Botão "Alterar" não encontrado');
        }
      });

      await page.evaluate((nome) => {
        const linhas = Array.from(document.querySelectorAll('tbody tr'));
      
        const linhaAlvo = linhas.find(tr => {
          return tr.innerText.includes(nome);
        });
      
        if (linhaAlvo) {
          const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
          linhaAlvo.dispatchEvent(event);
          console.log("✅ Duplo clique disparado na linha.");
        } else {
          console.warn("❌ Linha com nome não encontrada.");
        }
      }, data.name);      
      await new Promise(resolve => setTimeout(resolve, 6000));   

      await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span.x-tab-inner'));
        const botao = spans.find(el => el.textContent.includes('Dados de Contato'));
        if (botao) botao.click();
      });

      await page.waitForSelector('input[name="PESSOA$NU_CEP"]');
      await page.type('input[name="PESSOA$NU_CEP"]', data.zip_code);
      await page.click('input[name="PESSOA$NO_ENDERECO"]');

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('.x-btn-inner');
        const buttons = await page.$$('.x-btn-inner');
        
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.innerText, btn);
          if (text.trim() === 'Confirma') {
            await btn.click();
            await page.waitForSelector('input[name="PESSOA$NO_ENDERECO"]');
            await page.type('input[name="PESSOA$NO_ENDERECO"]', data.zip_code);
            await fillInputAndSelect(page, 'input[name="PESSOA$CO_UF"]', 'UF');
            await fillInputAndSelect(page, 'input[name="PESSOA$CO_MUNICIPIO"]', 'Município');
            await page.waitForSelector('input[name="PESSOA$NO_BAIRRO"]');
            await page.type('input[name="PESSOA$NO_BAIRRO"]', data.neighborhood);
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
  
      } catch (navErr) {
        throw new Error(`❌ CEP encontrado.`);
      }

      let regex = /\((\d{2})\)(\d{5})-(\d{4})/;
      let match = data.phone.match(regex);
      let ddd = 11;
      let number = '99999-9999';
      if (match) {
        ddd = match[1];        // DDD (77)
        number = match[2] + '-' + match[3]; // Número (991257700)
      }
      await page.waitForSelector('input[name="PESSOA$NU_DDD_CEL"]');
      await page.type('input[name="PESSOA$NU_DDD_CEL"]', ddd);
      await page.waitForSelector('input[name="PESSOA$NU_CELULAR"]');
      await page.type('input[name="PESSOA$NU_CELULAR"]', number);

      if (data.spouse && data.spouse.income_participant) {
        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span.x-tab-inner'));
          const botao = spans.find(el => el.textContent.includes('Cônjuge'));
          if (botao) botao.click();
        });

        await page.waitForSelector('input[name="CONJUGE$NU_CPFCNPJ"]');
        await page.type('input[name="CONJUGE$NU_CPFCNPJ"]', data.spouse.cpf);
        await page.waitForSelector('input[name="CONJUGE$NO_PESSOA"]');
        await page.type('input[name="CONJUGE$NO_PESSOA"]', data.spouse.name);
        await page.waitForSelector('input[name="CONJUGE$IN_EADQUIRENTE"]');
        await page.click('input[name="CONJUGE$IN_EADQUIRENTE"]');
        await page.waitForSelector('input[name="CONJUGE$DT_NASCIMENTO"]');
        await page.type('input[name="CONJUGE$DT_NASCIMENTO"]', data.spouse.birth_date);

        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span.x-tab-inner'));
          const botao = spans.find(el => el.textContent.includes('Dados de Contato'));
          if (botao) botao.click();
        });

        const clicou = await page.$$eval('span.x-tab-inner', (spans) => {
          const botoes = spans.filter(el => el.textContent.includes('Dados de Contato'));
          if (botoes.length >= 2) {
            botoes[1].click();
            return true;
          }
          return false;
        });
        
        if (!clicou) {
          throw new Error('❌ Segundo botão "Dados de Contato" não encontrado ou não clicável.');
        }

        match = data.spouse.phone.match(regex);
        ddd = 11;
        number = '99999-9999';
        if (match) {
          ddd = match[1];        // DDD (77)
          number = match[2] + '-' + match[3]; // Número (991257700)
        }
        await page.waitForSelector('input[name="CONJUGE$NU_DDD_CEL"]');
        await page.type('input[name="CONJUGE$NU_DDD_CEL"]', ddd);
        await page.waitForSelector('input[name="CONJUGE$NU_CELULAR"]');
        await page.type('input[name="CONJUGE$NU_CELULAR"]', number);
        await page.waitForSelector('input[name="CONJUGE$NO_EMAIL"]');
        await page.type('input[name="CONJUGE$NO_EMAIL"]', data.spouse.email);
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 6000));

        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const botao = spans.find(el => el.textContent.trim() === 'Confirmar');
          if (botao) {
            botao.click();
            console.log('✅ Clicou no Confirmar');
          } else {
            console.warn('❌ Botão "Confirmar" não encontrado');
          }
        });  
      } catch (navErr) {
        throw new Error(`❌ Salvar dados cliente não encontrado.`);
      }

      try {
          await new Promise(resolve => setTimeout(resolve, 6000));

          await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const botao = spans.find(el => el.textContent.trim() === 'Imóvel Operação');
            if (botao) {
              botao.click();
              console.log('✅ Clicou no Imóvel Operação');
            } else {
              console.warn('❌ Botão "Imóvel Operação" não encontrado');
            }
          });

      } catch (navErr) {
        throw new Error(`❌ Imóvel Operação não encontrado.`);
      }

      await page.waitForSelector('input[name="IMOVEL_OPERACAO$NU_CEP"]');
      await page.type('input[name="IMOVEL_OPERACAO$NU_CEP"]', data.zip_code_property);
      await page.click('input[name="IMOVEL_OPERACAO$NO_ENDERECO"]');

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('.x-btn-inner');
        const buttons = await page.$$('.x-btn-inner');
        
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.innerText, btn);
          if (text.trim() === 'Ok') {
            await btn.click();
            await page.waitForSelector('input[name="IMOVEL_OPERACAO$NO_ENDERECO"]');
            await page.type('input[name="IMOVEL_OPERACAO$NO_ENDERECO"]', data.street_property);
            await fillInputAndSelect(page, 'input[name="IMOVEL_OPERACAO$CO_UF"]', 'UF');
            await fillInputAndSelect(page, 'input[name="IMOVEL_OPERACAO$NU_MUNICIPIO"]', 'Município');
            await page.waitForSelector('input[name="IMOVEL_OPERACAO$NO_BAIRRO"]');
            await page.type('input[name="IMOVEL_OPERACAO$NO_BAIRRO"]', data.neighborhood_property);
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (navErr) {
        throw new Error(`❌ CEP encontrado.`);
      }

      let type_property = 'Residencial';
      if (data.type_property !== "1") {
        type_property = 'Comercial';
      }
      await fillInputAndSelect(page, 'input[name="IMOVEL_OPERACAO$IN_TIPO_IMOVEL"]', type_property);
      await fillInputAndSelect(page, 'input[name="IMOVEL_OPERACAO$IN_USO_DO_IMOVEL"]', data.type_property_tmp);

      //Salvar
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const botao = spans.find(el => el.textContent.trim() === 'Salvar');
          if (botao) {
            botao.click();
            console.log('✅ Clicou no Salvar');
          } else {
            console.warn('❌ Botão "Salvar" não encontrado');
          }
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (navErr) {
        console.log(navErr);
        throw new Error(`❌ Salvar não encontrado.`);
      }

      try {
        //Tarefas
        console.log("Clicando em Tarefas");
        await new Promise(resolve => setTimeout(resolve, 2500));
        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const botao = spans.find(el => el.textContent.trim() === 'Tarefas');
          if (botao) {
            botao.click();
            console.log('✅ Clicou no Tarefas');
          } else {
            console.warn('❌ Botão "Tarefas" não encontrado');
          }
        });
        //Envio
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const botao = spans.find(el => el.textContent.trim() === 'Iniciar');
          if (botao) {
            botao.click();
            console.log('✅ Clicou no Iniciar');
          } else {
            console.warn('❌ Botão "Iniciar" não encontrado');
          }
        });
        //Finaliza
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const botao = spans.find(el => el.textContent.trim() === 'Finalizar');
          if (botao) {
            botao.click();
            console.log('✅ Clicou no Finalizar');
          } else {
            console.warn('❌ Botão "Finalizar" não encontrado');
          }
        });

        const clicou = await page.$$eval('span.x-btn-inner', (spans) => {
          const botoes = spans.filter(el => el.textContent.includes('Finalizar'));
          if (botoes.length >= 2) {
            botoes[1].click();
            return true;
          }
          return false;
        });
        
        if (!clicou) {
          console.log('❌ Segundo botão "Finalizar" não encontrado ou não clicável.');
        }
      } catch (navErr) {
        console.log(navErr);
        console.log(`❌ Finalizando a digitação Final.`);
      }
    } catch (navErr) {
      console.log(navErr);
      console.log(`❌ Finalizando a digitação.`);
    }

    response = {
      Proposta: data.cpf,
      File64: '',
      StatusFaseProposta: 'ANDAMENTO',
      Status: 'ANDAMENTO',
      Motivo: 'ANDAMENTO'
    };

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