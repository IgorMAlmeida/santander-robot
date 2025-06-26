import loginItauImovel from "./login.js";
import validate from "./validate.js";
import puppeteer from "puppeteer-extra";

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
    const ITAU_IMOVEL_URL = (process.env.ITAU_IMOVEL_URL || 'https://plataformaitauimoveis.cloud.itau.com.br/Portal/').replace(/"/g, '').trim();

    await page.goto(ITAU_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada: ", ITAU_IMOVEL_URL);
 
    await loginItauImovel(page);

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
      await page.waitForSelector('#simulador_de_financiamento_menu a', { visible: true });
      await page.hover('#simulador_de_financiamento_menu a');
      console.log('✔️ Menu de financiamento visível após hover');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const linkSelector = data.type_produt == "loanWithPropertyGuarantee"
      ? 'a[href="Simulacao_Cgi.html"]'
      : 'a[href="simulador_de_financiamento_isolado.html"]';

      await page.waitForSelector(linkSelector, { visible: true });
      await page.click(linkSelector);
      
      const linkText = data.type_produt == "loanWithPropertyGuarantee" ? 'CGI' : 'FI';
      console.log(`✔️ Link "${linkText}" clicado com sucesso`);    
    } catch (error) {
      console.log('Erro durante a execução dos comandos:', error);
    }

    if (data.type_produt == "loanWithPropertyGuarantee") {
      try {
        await page.waitForSelector('#txtNome', { visible: true });
        await page.click('#txtNome');
        await page.type('#txtNome', data.name);

        await page.waitForSelector('#txtCPFPrincipal', { visible: true });
        await page.click('#txtCPFPrincipal');
        await page.type('#txtCPFPrincipal', data.cpf);

        await page.waitForSelector('#txtDataNacimentoPrimario', { visible: true });
        await page.click('#txtDataNacimentoPrimario');
        await page.type('#txtDataNacimentoPrimario', data.birth_date);

        await page.waitForSelector('#txtEmail', { visible: true });
        await page.click('#txtEmail');
        await page.type('#txtEmail', data.email);

        await page.waitForSelector('#txtTelefone', { visible: true });
        await page.click('#txtTelefone');
        await page.type('#txtTelefone', data.phone);

        await page.waitForSelector('#txtSistema_Amortizacao_Simulacao', { visible: true });
        await page.click('#txtSistema_Amortizacao_Simulacao');
        await page.select('#txtSistema_Amortizacao_Simulacao', data.amortization); // SAC OU PRICE

        await page.click('#txtValorImovelCGI');
        await page.type('#txtValorImovelCGI', data.property_value, { delay: 50 });

        await page.click('#txtValorFinanciamentoCGI');
        await page.type('#txtValorFinanciamentoCGI', data.input_value, { delay: 50 });
        await page.click('#txtPrazoMesesCGI');

        try {
          const modalBody = await page.waitForSelector('.bootbox-body', { timeout: 3000 });
          const text = await modalBody.evaluate(el => el.textContent.trim());
        
          console.log('⚠️ Modal detectado com mensagem:', text);
        
          if (
            text.includes('prazo máximo para o seu financiamento') ||
            text.includes('valor mínimo de financiamento') ||
            text.includes('valor mínimo')
          ) {
            await page.click('button[data-bb-handler="ok"]');
            console.log('✅ Modal fechado');
          }
        } catch (e) {
          console.log('ℹ️ Nenhum modal apareceu. Seguindo...');
        }

        await page.click('#txtPrazoMesesCGI');
        await page.type('#txtPrazoMesesCGI', String(data.financing_term));
        await page.click('#txtValorFinanciamentoCGI');

        try {
          const modalBody = await page.waitForSelector('.bootbox-body', { timeout: 3000 });
          const text = await modalBody.evaluate(el => el.textContent.trim());
        
          console.log('⚠️ Modal detectado com mensagem:', text);
        
          if (
            text.includes('prazo máximo para o seu financiamento') ||
            text.includes('valor mínimo de financiamento') ||
            text.includes('valor mínimo')
          ) {
            await page.click('button[data-bb-handler="ok"]');
            console.log('✅ Modal fechado');
          }
        } catch (e) {
          console.log('ℹ️ Nenhum modal apareceu. Seguindo...');
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        let valorAtual = await page.$eval('#txtPrazoMesesCGI', el => parseInt(el.value));

        if (data.iof){
          const checkboxSelector = '#chqFinanciarIOF';
          const isChecked = await page.$eval(checkboxSelector, el => el.checked);

          if (!isChecked) {
            await page.click(checkboxSelector);
          }
        }

        if (
          (Array.isArray(data.participants) && data.participants.length > 0) ||
          (data.spouse && data.spouse.income_participant) || data.marital_status == "CASADO"
        ) {
          await page.click('#Somar_rendaN');
        } else {
          await page.click('#Somar_rendaN');
        }

        await page.click('#btnSimular');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('#botao_detalhes', { visible: true });
        await page.click('#botao_detalhes');
        await page.waitForSelector('#frmSimulacaonovo', { visible: true });

        const dados = await page.evaluate(() => {
          const spans = document.querySelectorAll('#frmSimulacaonovo .class_texto2_novo');
          console.log(spans);
          const resultado = {};
      
          spans.forEach((labelSpan) => {
            const label = labelSpan.textContent.trim().toLowerCase();
            const valorSpan = labelSpan.nextElementSibling;
      
            if (valorSpan && valorSpan.classList.contains('class_texto3_novo')) {
              const valor = valorSpan.textContent.trim();
              console.log(valor);

              if (label.includes('primeira parcela')) {
                resultado.valorPrimeiraParcela = valor;
              } else if (label.includes('total a pagar')) {
                resultado.totalAPagar = valor;
              } else if (label.includes('juros anual')) {
                resultado.txAnual = valor;
              } else if (label.includes('juros mensal')) {
                resultado.txMenal = valor;
              } else if (label.includes('cet mensal')) {
                resultado.cetMensal = valor;
              } else if (label.includes('valor do crédito')) {
                resultado.valor = valor;
              }
            }
          });
      
          console.log(resultado);
          return resultado;
        });
        
        await page.waitForSelector('a[onclick="gerar_pdf_resultado()"]', { visible: true });
        await page.click('a[onclick="gerar_pdf_resultado()"]');

        await page.waitForSelector('.modal-title.text-center', { visible: true });
        const titulo = await page.$eval('.modal-title.text-center', el => el.textContent.trim());
        console.log('📄 Modal aberto com título:', titulo);
        await page.waitForSelector('iframe', { visible: true });

        const pdfBase64 = await page.evaluate(async () => {
          const iframe = document.querySelector('iframe[src^="blob:"]');
          const blobUrl = iframe?.src;
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

        await page.click('.bootbox-close-button.close');
        await page.click('#btnPreencherProposta2');

        await page.waitForSelector('#EstadoImovel', { visible: true });
        await page.click('#EstadoImovel');
        await page.select('#EstadoImovel', data.state_property);

        await page.click('#Nacionalidade_Principal');
        await page.select('#Nacionalidade_Principal', "BRASILEIRO");

        await page.click('#Sistema_Amortizacao');
        await page.select('#Sistema_Amortizacao', data.amortization);

        await page.waitForSelector('#CEP_Principal', { visible: true });
        await page.click('#CEP_Principal');
        await page.type('#CEP_Principal', data.zip_code);

        await page.waitForSelector('#Endereco_Principal', { visible: true });
        await page.click('#Endereco_Principal');
        await page.type('#Endereco_Principal', data.street);

        await page.waitForSelector('#Bairro_Principal', { visible: true });
        await page.click('#Bairro_Principal');
        await page.type('#Bairro_Principal', data.neighborhood);

        await page.waitForSelector('#Cidade_Principal', { visible: true });
        await page.click('#Cidade_Principal');
        await page.type('#Cidade_Principal', data.city);

        await page.waitForSelector('#UF_Principal', { visible: true });
        await page.click('#UF_Principal');
        await page.type('#UF_Principal', data.state);

        await page.waitForSelector('#Numero_End_Principal', { visible: true });
        await page.click('#Numero_End_Principal');
        await page.type('#Numero_End_Principal', data.number);

        await page.waitForSelector('#Complemento_Principal', { visible: true });
        await page.click('#Complemento_Principal');
        await page.type('#Complemento_Principal', data.complement);

        await page.waitForSelector('#Profissao_Principal', { visible: true });
        await page.click('#Profissao_Principal');
        await page.type('#Profissao_Principal', data.proof_income_position);

        await page.waitForSelector('#Renda_Mensal_Liquida_Principal', { visible: true });
        await page.click('#Renda_Mensal_Liquida_Principal');
        await page.type('#Renda_Mensal_Liquida_Principal', data.income_value);

        await page.waitForSelector('#Tipo_Renda_Principal', { visible: true });
        await page.click('#Tipo_Renda_Principal');
        await page.select('#Tipo_Renda_Principal', data.proof_income);

        if (data.proof_income === "Sócio Proprietário") {
          await page.waitForSelector('#CNPJ_Principal', { visible: true });
          await page.click('#CNPJ_Principal');
          await page.type('#CNPJ_Principal', data.proof_income_legal_cnpj);
        }

        await page.waitForSelector('#ConfirmeEmail_Principal', { visible: true });
        await page.click('#ConfirmeEmail_Principal');
        await page.type('#ConfirmeEmail_Principal', data.email);

        await page.waitForSelector('#Estado_Civil_Principal', { visible: true });
        await page.click('#Estado_Civil_Principal');
        await page.select('#Estado_Civil_Principal', data.marital_status); // SOLTEIRO - VIUVO - DIVORCIADO - SEPARADO - CASADO

        if (data.marital_status == "CASADO") {
          await page.waitForSelector('#Nome_Conjuge', { visible: true });
          await page.click('#Nome_Conjuge');
          await page.type('#Nome_Conjuge', data.spouse.name);
  
          await page.waitForSelector('#CPF_Conjuge', { visible: true });
          await page.click('#CPF_Conjuge');
          await page.type('#CPF_Conjuge', data.spouse.cpf);
  
          await page.waitForSelector('#Data_Nasc_Conjuge', { visible: true });
          await page.click('#Data_Nasc_Conjuge');
          await page.type('#Data_Nasc_Conjuge', data.spouse.birth_date);
        }

        if (
          (Array.isArray(data.participants) && data.participants.length > 0) ||
          (data.spouse && data.spouse.income_participant)
        ) {
          await page.click('#Composicao_de_RendaN');
        } else {
          await page.click('#Composicao_de_RendaN');
        }

        await page.select('#cmbPDVParceiro', '4947');
        await page.click('input[name="contato_proposta"][value="false"]');

        await page.click('#btnEnviarDados');

        const btn = await page.$('.btn-warning');
        if (btn) {
          const isVisible = await btn.boundingBox() !== null;
          if (isVisible) {
            await btn.click();
            await page.click('#btnEnviarDados');
          } else {
            console.log('⚠️ Botão de aviso não visível ou clicável — nenhuma ação tomada.');
          }
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        await page.click('#btnConfirmardados');
        await new Promise(resolve => setTimeout(resolve, 20000));
        console.log(pdfBase64);
        const numeroProposta = await page.$eval('#lblNumeroProposta', el => el.textContent.trim());
        console.log('Número da proposta:', numeroProposta);

        await page.click('#btnconsultanovamente');
        console.log('✅ Botão "Ir para acompanhamento" clicado com sucesso.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        let statusProposta= 'em_analise_credito';
        let spanStatusProposta= 'em_analise_credito';
        let motivoRecusa= 'A proposta está em análise de crédito. Tente novamente mais tarde.';

        if (currentURL.includes('/erro/Error500.html')) {
          console.log(`⚠️ Proposta ${numeroProposta} em análise de crédito (URL de erro 500 detectada).`);
          response = {
            Proposta: numeroProposta,
            File64: pdfBase64,
            StatusFaseProposta: statusProposta,
            Status: spanStatusProposta,
            Motivo: motivoRecusa,
            valorPrimeiraParcela: dados.valorPrimeiraParcela,
            somatorioParcelas: dados.totalAPagar,
            custosAdicionais: dados.valor - data.inputValue,
            valorTotalFinanciamento: dados.valor,
            cesh: dados.cetMensal,
            taxaJuros: dados.txMenal,
            term: valorAtual,
            amortization: data.amortization,
            tr: "TR"
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
        const inputValue = parseFloat(data.input_value);
        response = {
          Proposta: numeroProposta,
          File64: pdfBase64,
          StatusFaseProposta: statusProposta,
          Status: spanStatusProposta,
          Motivo: motivoRecusa,
          valorPrimeiraParcela: dados.valorPrimeiraParcela,
          somatorioParcelas: dados.totalAPagar,
          custosAdicionais: dados.valor - data.inputValue,
          valorTotalFinanciamento: dados.valor,
          cesh: dados.cetMensal,
          taxaJuros: dados.txMenal,
          term: valorAtual,
          amortization: data.amortization,
          tr: "TR"
        };
        await page.click('#logoff-action');
      } catch (error) {
        console.error('❌ Erro ao preencher os campos:', error);
      }
    } else {
      //#########################################Preenche formulario Simulação Fi
      try {
        await page.waitForSelector('#txtNome', { visible: true });
        await page.click('#txtNome');
        await page.type('#txtNome', data.name);

        await page.waitForSelector('#txtCPFPrincipal', { visible: true });
        await page.click('#txtCPFPrincipal');
        await page.type('#txtCPFPrincipal', data.cpf);

        await page.waitForSelector('#txtDataNascimentoPrimario', { visible: true });
        await page.click('#txtDataNascimentoPrimario');
        await page.type('#txtDataNascimentoPrimario', data.birth_date); // 'Y-m-d

        await page.waitForSelector('#txtCepPrincipal', { visible: true });
        await page.click('#txtCepPrincipal');
        await page.type('#txtCepPrincipal', data.zip_code);

        await page.waitForSelector('#txtRendaPrincipal', { visible: true });
        await page.click('#txtRendaPrincipal');
        await page.type('#txtRendaPrincipal', data.income_value);

        await page.waitForSelector('#txtEmail', { visible: true });
        await page.click('#txtEmail');
        await page.type('#txtEmail', data.email);

        await page.waitForSelector('#txtTelefone', { visible: true });
        await page.click('#txtTelefone');
        await page.type('#txtTelefone', data.phone);

        await page.waitForSelector('#Estado_Civil_Principal', { visible: true });
        await page.click('#Estado_Civil_Principal');
        await page.select('#Estado_Civil_Principal', data.marital_status); // SOLTEIRO - VIUVO - DIVORCIADO - SEPARADO - CASADO

        if (
          (Array.isArray(data.participants) && data.participants.length > 0) ||
          (data.spouse && data.spouse.income_participant) || data.marital_status == "CASADO"
        ) {
          await page.click('#Somar_rendaN');
        } else {
          await page.click('#Somar_rendaN');
        }

        await page.waitForSelector('#cboTipoImovel', { visible: true });
        await page.click('#cboTipoImovel');
        await page.select('#cboTipoImovel', data.type_property); // RESIDENCIAL OU COMERCIAL

        await page.click('#taxa_padrao');

        await page.click('#txtValorImovel');
        await page.type('#txtValorImovel', data.property_value, { delay: 50 });

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break;
          }
        }

        await page.click('#txtValorEntrada');
        await page.type('#txtValorEntrada', data.input_value, { delay: 50 });

        if (data.itbi){
          await page.click('#chqFinanciarITBI');
          await page.click('#ValorITBI');
          await page.type('#ValorITBI', '5');
        }

        await page.click('#txtPrazoMeses');

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break;
          }
        }

        await page.click('#btnSimular');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('#btnGerarPDF_divDadosParcelas', { visible: true });
        const valorPrimeiraParcela = await page.$eval('#lblValorPrimeiraParcela', el => el.textContent.trim());
        const somatorioParcelas = await page.$eval('#lblValorSomatorioParcelas', el => el.textContent.trim());
        const custosAdicionais = await page.$eval('#colCustosAdicionaisCartorioTarifas', el => el.textContent.trim());
        const valorTotalFinanciamento = await page.$eval('#colValorTotalFinanciamento', el => el.textContent.trim());
        const taxaJuros = await page.$eval('#colTaxaJurosSimulada', el => el.textContent.trim());
        const cesh = await page.$eval('#colCESH', el => el.textContent.trim());
        const tr = await page.$eval('#colCorrecaoMonetaria', el => el.textContent.trim());
        const linhaCredito = await page.$eval('#colLinhaCredito', el => el.textContent.trim());
        await page.click('#btnGerarPDF_divDadosParcelas');

        await page.waitForSelector('iframe[src^="blob:"]');

        const pdfBase64 = await page.evaluate(async () => {
          const iframe = document.querySelector('iframe[src^="blob:"]');
          const blobUrl = iframe?.src;
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
      
        console.log('✅ PDF salvo como simulacao.pdf');
        await page.click('.bootbox-close-button.close');

        await page.click('#btnPreencherProposta');

        await page.click('#Sistema_Amortizacao');
        await page.select('#Sistema_Amortizacao', 'SAC'); // SAC OU MIX
        await page.click('#EstadoImovel');
        await page.select('#EstadoImovel', data.state_property);
        await page.click('#taxa_padrao');

        await page.click('#Tipo_Renda_Principal');
        await page.select('#Tipo_Renda_Principal', data.proof_income); // Assalariado - Aposentado - Autônomo - Profissional Liberal - Sócio Proprietário (abre campo cnpj)

        if (data.proof_income === "Sócio Proprietário") {
          await page.waitForSelector('#CNPJ_Principal', { visible: true });
          await page.click('#CNPJ_Principal');
          await page.type('#CNPJ_Principal', data.proof_income_legal_cnpj);
        }

        await page.select('#cmbPDVParceiro', '4947');
        await page.click('input[name="contato_proposta"][value="false"]');

        await page.waitForSelector('#Prazo_Financiamento', { visible: true });
        let valorAtual = await page.$eval('#Prazo_Financiamento', el => parseInt(el.value));
        await page.click('#Prazo_Financiamento', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#Prazo_Financiamento', String(valorAtual + 5));
        await page.click('input[name="contato_proposta"][value="false"]');

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        valorAtual = await page.$eval('#Prazo_Financiamento', el => parseInt(el.value));

        await page.click('#btnEnviarDados');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await page.waitForSelector('#chqScr', { visible: true });  
        await page.click('#chqScr');
        await page.click('#btnConfirmardados');

        const modalSelector = '.bootbox.modal.fade.bootbox-alert.in';

        try {
          await page.waitForSelector(modalSelector, { visible: true, timeout: 5000 });
          await page.click('.bootbox .btn-warning');
          await page.waitForSelector(modalSelector, { hidden: true });
          await page.click('#btnConfirmardados');
        } catch (error) {
          console.log('⚠️ Modal de erro não apareceu, continuando...');
        }
        
        const successModalSelector = '.bootbox.modal.fade.in';
        try {
          await page.waitForSelector(successModalSelector, { visible: true, timeout: 5000 });
          const surveyModalSelector = '.bootbox .modal-body h5#subTituloPesquisaDeSatisfacao';
          await page.waitForSelector(surveyModalSelector, { visible: true, timeout: 3000 });

          await page.click('.bootbox .modal-footer .btn-default');
        
          console.log('✅ Modal de pesquisa de satisfação fechado.');
        } catch (e) {
          console.log('⚠️ Modal de sucesso ou pesquisa de satisfação não apareceu, encerrando sessão...');
          await page.click('#logoff-action');
        
          response = {
            StatusFaseProposta: "Erro",
            Status: "Erro",
            Motivo: "Erro"
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));

        const numeroProposta = await page.$eval('#lblNumeroProposta', el => el.textContent.trim());
        console.log('Número da proposta:', numeroProposta);

        await page.click('.fa-search');
        await page.waitForSelector('#numeroProposta', { visible: true });
        await page.click('#numeroProposta');
        await page.type('#numeroProposta', numeroProposta);
        page.click('#btnConsultarProposta');

        await new Promise(resolve => setTimeout(resolve, 10000));
        let statusProposta= 'em_analise_credito';
        let spanStatusProposta= 'em_analise_credito';
        let motivoRecusa= 'A proposta está em análise de crédito. Tente novamente mais tarde.';
        
        const currentURL = page.url();
        if (currentURL.includes('/erro/Error500.html')) {
          console.log(`⚠️ Proposta ${numeroProposta} em análise de crédito (URL de erro 500 detectada).`);
          response = {
            Proposta: numeroProposta,
            File64: pdfBase64,
            StatusFaseProposta: statusProposta,
            Status: spanStatusProposta,
            Motivo: motivoRecusa,
            valorPrimeiraParcela: valorPrimeiraParcela,
            somatorioParcelas: somatorioParcelas,
            custosAdicionais: custosAdicionais,
            valorTotalFinanciamento: valorTotalFinanciamento,
            cesh: cesh,
            taxaJuros: taxaJuros,
            term: valorAtual,
            amortization: data.amortization,
            tr: linhaCredito + " - " + tr
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
          Proposta: numeroProposta,
          File64: pdfBase64,
          StatusFaseProposta: statusProposta,
          Status: spanStatusProposta,
          Motivo: motivoRecusa,
          valorPrimeiraParcela: valorPrimeiraParcela,
          somatorioParcelas: somatorioParcelas,
          custosAdicionais: custosAdicionais,
          valorTotalFinanciamento: valorTotalFinanciamento,
          cesh: cesh,
          taxaJuros: taxaJuros,
          term: valorAtual,
          amortization: data.amortization,
          tr: linhaCredito + " - " + tr
        };
        await page.click('#logoff-action');
      } catch (error) {
        console.error('❌ Erro ao preencher os campos:', error);
      }
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
