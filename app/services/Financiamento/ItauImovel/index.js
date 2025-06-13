import validate from "./validate.js";
import puppeteer from "puppeteer-extra";

export default async function simulation(data) {
  try {
    const selectors = ['.bootbox:nth-child(14) .btn', '.in .btn', '.btn-warning'];
    const { isValid, errors } = validate(data);

    if (!isValid) {
      const error = new Error("Existem dados inválidos ou faltando.");
      error.details = errors;
      throw error;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      slowMo: 50,
    });
  
    const pagesBefore = await browser.pages();
    const page = pagesBefore[0];

    let response = "Teste";
    const username = process.env.ITAU_IMOVEL_LOGIN;
    const password = process.env.ITAU_IMOVEL_PASS_LOGIN;
    const ITAU_IMOVEL_URL = (process.env.ITAU_IMOVEL_URL || '').replace(/"/g, '').trim();
    console.log("🔗 Acessando:", ITAU_IMOVEL_URL);

    await page.goto(ITAU_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada");

    // Aguarda o campo de e-mail aparecer
    await page.waitForSelector('input[name="txtUsuario"]', { timeout: 10000 });
    console.log("🟢 Campo de e-mail localizado");
    await page.type('input[name="txtUsuario"]', username);

    await page.waitForSelector('input[name="txtSenha"]', { timeout: 10000 });
    console.log("🟢 Campo de senha localizado");
    await page.type('input[name="txtSenha"]', password);

    //Login
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
    
      // Espera a navegação completar
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

    //Comunicado Inicial
    try {
      await page.waitForSelector('#btnOk0', { visible: true, timeout: 30000 }); // espera até 10 segundos
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
    
    //Seleciona menu
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
        await page.type('#txtDataNacimentoPrimario', data.birth_date); // 'd/m/Y

        await page.waitForSelector('#txtEmail', { visible: true });
        await page.click('#txtEmail');
        await page.type('#txtEmail', data.email);

        await page.waitForSelector('#txtTelefone', { visible: true });
        await page.click('#txtTelefone');
        await page.type('#txtTelefone', data.phone);

        await page.waitForSelector('#txtSistema_Amortizacao_Simulacao', { visible: true });
        await page.click('#txtSistema_Amortizacao_Simulacao');
        await page.select('#txtSistema_Amortizacao_Simulacao', data.amortization); // SAC OU PRICE

        await page.click('#txtValorImovelCGI'); // foca no campo
        await page.type('#txtValorImovelCGI', data.property_value, { delay: 50 });

        await page.click('#txtValorFinanciamentoCGI'); // foca no campo
        await page.type('#txtValorFinanciamentoCGI', data.input_value, { delay: 50 });

        await page.click('#txtPrazoMesesCGI'); // foca no campo
        await page.type('#txtPrazoMesesCGI', String(data.financing_term));
        await page.click('#txtValorFinanciamentoCGI'); // ou outro seletor visível da página

        await page.waitForSelector('.bootbox.modal', { visible: true });
        const modalText = await page.$eval('.bootbox-body', el => el.textContent);
        if (modalText.includes('prazo máximo para o seu financiamento')) {
          // Clica no botão OK do modal
          await page.click('button[data-bb-handler="ok"]');
        }

        if (data.iof){
          const checkboxSelector = '#chqFinanciarIOF';

          // Verifica se já está marcado
          const isChecked = await page.$eval(checkboxSelector, el => el.checked);

          // Marca se ainda não estiver
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

        await page.click('#btnSimular'); // foca no campo
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('#botao_detalhes', { visible: true });
        await page.click('#botao_detalhes');
        await page.waitForSelector('#frmSimulacaonovo', { visible: true });

        // Lê os dados antes de clicar no botão PDF
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
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove prefixo data:application/pdf;base64,
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

        // const buffer = Buffer.from(pdfBase64, 'base64');
        // fs.writeFileSync(data.type_produt + '_' + data.cpf + '_simulacao.pdf', buffer);
        // console.log('✅ PDF salvo como simulacao.pdf');
        await page.click('.bootbox-close-button.close');
        await page.click('#btnPreencherProposta2'); // foca no campo

        await page.waitForSelector('#EstadoImovel', { visible: true });
        await page.click('#EstadoImovel');
        await page.select('#EstadoImovel', data.state_property); // nome completo do estado

        await page.click('#Nacionalidade_Principal');
        await page.select('#Nacionalidade_Principal', "BRASILEIRO"); // nome completo do estado

        await page.click('#Sistema_Amortizacao');
        await page.select('#Sistema_Amortizacao', data.amortization); // SAC OU MIX

        await page.waitForSelector('#CEP_Principal', { visible: true });
        await page.click('#CEP_Principal');
        await page.type('#CEP_Principal', data.zip_code);

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
          await page.type('#Data_Nasc_Conjuge', data.spouse.birth_date); // 'd/m/Y
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

        await page.click('#btnEnviarDados'); // foca no campo

        const btn = await page.$('.btn-warning');
        if (btn) {
          const isVisible = await btn.boundingBox() !== null;
          if (isVisible) {
            await btn.click();
            await page.click('#btnEnviarDados'); // foca no campo
          } else {
            console.log('⚠️ Botão de aviso não visível ou clicável — nenhuma ação tomada.');
          }
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        await page.click('#btnConfirmardados'); // foca no campo
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const numeroProposta = await page.$eval('#lblNumeroProposta', el => el.textContent.trim());
        console.log('Número da proposta:', numeroProposta);

        await page.click('#btnconsultanovamente');
        console.log('✅ Botão "Ir para acompanhamento" clicado com sucesso.');
        await new Promise(resolve => setTimeout(resolve, 10000));

        const statusProposta = await page.$eval('#spanFaseStatusProposta', el => el.textContent.trim());
        console.log('Status da proposta:', statusProposta);
        const spanStatusProposta = await page.$eval('#spanStatusProposta', el => el.textContent.trim());
        console.log('Status da proposta:', spanStatusProposta);
        const motivoRecusa = await page.$eval('#MotivoRecusa', el => el.textContent.trim());
        console.log('Status da proposta:', motivoRecusa);
        const inputValue = parseFloat(data.input_value);
        response = {
          Proposta: numeroProposta, // variável numeroProposta deve ser definida anteriormente
          File64: pdfBase64,
          StatusFaseProposta: statusProposta, // variável statusProposta deve ser definida anteriormente
          Status: spanStatusProposta,
          Motivo: motivoRecusa,
          valorPrimeiraParcela: dados.valorPrimeiraParcela,
          somatorioParcelas: dados.totalAPagar,
          custosAdicionais: dados.valor - data.inputValue,
          valorTotalFinanciamento: dados.valor,
          cesh: dados.cetMensal,
          taxaJuros: dados.txMenal,
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

        await page.click('#txtValorImovel'); // foca no campo
        await page.type('#txtValorImovel', data.property_value, { delay: 50 });

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break; // Clicou no primeiro botão que aparecer, então para
          }
        }

        await page.click('#txtValorEntrada'); // foca no campo
        await page.type('#txtValorEntrada', data.input_value, { delay: 50 });

        if (data.itbi){
          await page.click('#chqFinanciarITBI');
          await page.click('#ValorITBI'); // foca no campo
          await page.type('#ValorITBI', '5');
        }

        await page.click('#txtPrazoMeses'); // foca no campo
        // await page.type('#txtPrazoMeses', data.financing_term);

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break; // Clicou no primeiro botão que aparecer, então para
          }
        }

        //Click botão criar proposta:
        await page.click('#btnSimular'); // foca no campo
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
        await page.click('#btnGerarPDF_divDadosParcelas'); // foca no campo

        await page.waitForSelector('iframe[src^="blob:"]');

        const pdfBase64 = await page.evaluate(async () => {
          const iframe = document.querySelector('iframe[src^="blob:"]');
          const blobUrl = iframe?.src;
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove prefixo data:application/pdf;base64,
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

        // const buffer = Buffer.from(pdfBase64, 'base64');
        // fs.writeFileSync(data.type_produt + '_' + data.cpf + '_simulacao.pdf', buffer);
      
        console.log('✅ PDF salvo como simulacao.pdf');
        await page.click('.bootbox-close-button.close');

        await page.click('#btnPreencherProposta'); // foca no campo

        await page.click('#Sistema_Amortizacao');
        await page.select('#Sistema_Amortizacao', 'SAC'); // SAC OU MIX
        await page.click('#EstadoImovel');
        await page.select('#EstadoImovel', data.state_property); // nome completo do estado
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
        const valorAtual = await page.$eval('#Prazo_Financiamento', el => parseInt(el.value));
        await page.click('#Prazo_Financiamento', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#Prazo_Financiamento', String(valorAtual + 5));
        await page.click('input[name="contato_proposta"][value="false"]');

        for (const selector of selectors) {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            break; // Clicou no primeiro botão que aparecer, então para
          }
        }

        await page.click('#btnEnviarDados'); // foca no campo
        await new Promise(resolve => setTimeout(resolve, 10000));
        await page.waitForSelector('#chqScr', { visible: true });  
        await page.click('#chqScr'); // foca no campo
        await page.click('#btnConfirmardados'); // foca no campo

        const modalSelector = '.bootbox.modal.fade.bootbox-alert.in';

        // Aguarda até o modal de erro aparecer (no máximo 5 segundos)
        try {
          await page.waitForSelector(modalSelector, { visible: true, timeout: 5000 });
        
          // Clica no botão "OK"
          await page.click('.bootbox .btn-warning');
        
          // Espera o modal desaparecer
          await page.waitForSelector(modalSelector, { hidden: true });
        
          // Depois clica novamente no botão de confirmação
          await page.click('#btnConfirmardados');
        } catch (error) {
          console.log('⚠️ Modal de erro não apareceu, continuando...');
        }
        
        // Checa se o modal de sucesso apareceu
        const successModalSelector = '.bootbox.modal.fade.in';
        try {
          await page.waitForSelector(successModalSelector, { visible: true, timeout: 5000 });
        
          // Espera o conteúdo do modal de pesquisa
          const surveyModalSelector = '.bootbox .modal-body h5#subTituloPesquisaDeSatisfacao';
          await page.waitForSelector(surveyModalSelector, { visible: true, timeout: 3000 });
        
          // Clica no botão "Fechar"
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

        await new Promise(resolve => setTimeout(resolve, 10000));

        // Clica no botão de busca (ícone de lupa)
        await page.click('.fa-search');
        await page.waitForSelector('#numeroProposta', { visible: true });
        await page.click('#numeroProposta');
        await page.type('#numeroProposta', numeroProposta); // ou qualquer número
        await page.click('#btnConsultarProposta');
        const statusProposta = await page.$eval('#spanFaseStatusProposta', el => el.textContent.trim());
        console.log('Status da proposta:', statusProposta);
        const spanStatusProposta = await page.$eval('#spanStatusProposta', el => el.textContent.trim());
        console.log('Status da proposta:', spanStatusProposta);
        const motivoRecusa = await page.$eval('#MotivoRecusa', el => el.textContent.trim());
        console.log('Status da proposta:', motivoRecusa);
        response = {
          Proposta: numeroProposta, // variável numeroProposta deve ser definida anteriormente
          File64: pdfBase64,
          StatusFaseProposta: statusProposta, // variável statusProposta deve ser definida anteriormente
          Status: spanStatusProposta,
          Motivo: motivoRecusa,
          valorPrimeiraParcela: valorPrimeiraParcela,
          somatorioParcelas: somatorioParcelas,
          custosAdicionais: custosAdicionais,
          valorTotalFinanciamento: valorTotalFinanciamento,
          cesh: cesh,
          taxaJuros: taxaJuros,
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
