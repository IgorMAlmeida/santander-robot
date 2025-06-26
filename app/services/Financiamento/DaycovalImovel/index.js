import loginDaycovalImovel from "./login.js";
import { convertToNumber, typeInput, selectAndPostback, selectClick, extractSimulationResult, clickAndSavePdfBase64, getUFCode,
    typeAndSubmitWithValidation, typeAndSubmitWithMaxCheck, typeAndSubmitIntegerWithMaxCheck } from "./utils.js";
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
    const DAYCOVAL_IMOVEL_URL = (process.env.Daycoval_IMOVEL_URL || 'https://creditoimobiliario.daycoval.com.br/').replace(/"/g, '').trim();

    await page.goto(DAYCOVAL_IMOVEL_URL, { waitUntil: "domcontentloaded" });
    console.log("📄 Página carregada: ", DAYCOVAL_IMOVEL_URL);

    await loginDaycovalImovel(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await selectClick(page, '#button-1064-btnInnerEl',1000);
    await new Promise(resolve => setTimeout(resolve, 500));
    await selectClick(page, '#menuitem-1079-textEl',1000);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await browser.close();
    return {
      status: true,
      response,
    };

    await selectClick(page, 'a[href="/wsImoveis/AreaRestrita/Conteudo/Simulacao.aspx"]',1000);

    try {
      await selectClick(page, 'a[href="/wsImoveis/AreaRestrita/Conteudo/Simulacao.aspx"]',1000);
      await page.waitForSelector('#cphConteudo_iframeSimulador');
      const elementHandle = await page.$('#cphConteudo_iframeSimulador');
      const frame = await elementHandle.contentFrame();
      if (!frame) {
        throw new Error('❌ Não foi possível acessar o conteúdo do iframe.');
      }

      await page.goto('https://wspf.banco.Daycoval/CRIM.Imoveis/SimulacaoNew.aspx?IdParceiroUsuario=18167&IdIParceiro=14228&CNPJParceiro=13029909000114&EmailContatoParceiro=JULIANA.SOARES@CREDIFRANCO.COM.BR&NomeContatoParceiro=JULIANA%20BALESTRASSI', {
        waitUntil: 'domcontentloaded',
      });
      
      await selectAndPostback(page, '#rdoEstado', data.state_property, 3000);
      await selectAndPostback(page, '#ddlTipoImovel', data.type_property, 3000);
      await selectAndPostback(page, '#ddlTipoSituacaoImovel', '2', 3000);
      await typeAndSubmitWithMaxCheck(page, '#txtValorImovel', data.property_value, '#btnOkVlImovel', '#spnValorImovel');

      if (data.spouse && data.spouse.income_participant) {
        await selectClick(page, '#rdoSomarRendaConjuge_0', 3000);
      } else {
        await selectClick(page, '#rdoSomarRendaConjuge_1', 3000);
      }

      await typeAndSubmitWithValidation(page, '#txtDataNascimento', data.birth_date, '#btnOkDataNascimento', ['#reqtxtDataNascimento', '#RangeValidatorData', '#CustomValidatorData']);
      if (data.spouse && data.spouse.income_participant) {
        await typeAndSubmitWithValidation(page, '#txtDataNascimentoConjuge', data.spouse.birth_date, '#btnOkDataNascimentoConjuge', ['#reqtxtDataNascimentoConjuge', '#RangeValidatorDataConjuge', '#CustomValidatorDataConjuge']);
      }
      await selectClick(page, '#rdoTipoSimulacao_0', 3000);
      await typeAndSubmitWithMaxCheck(page, '#txtValorFinanciamento', data.input_value, '#btnOValorFinanciamento', '#spnValorFinanciamento');
      await typeAndSubmitIntegerWithMaxCheck(page, '#txtPrazo', data.financing_term, '#btnOkmeses', '#spnPrazo');

      if (data.itbi) {
        await selectClick(page, '#rdoFinanciarDespesas_0', 3000);
        await selectClick(page, '#chkDespesasItbi', 3000);

        const valorFinal = await convertToNumber(data.input_value);
        const textoSpan = await page.$eval('#spnValorFinanciamento', el => el.innerText);
        const match = textoSpan.match(/R\$ ?([\d.,]+)/i);
    
        if (!match) {
            throw new Error(`❌ Não foi possível identificar o valor máximo no span (${spanSelector}).`);
        }
        const valorMaximo = await convertToNumber(match[1]);
        const itbiText = await page.$eval('#txtDespesasItbi', el => el.value);
        const itbiValue = await convertToNumber(itbiText);
        
        if ((valorFinal + itbiValue) > valorMaximo) {
            console.warn(`⚠️ Valor (${valorFinal}) excede o máximo (${valorMaximo}). Usando o valor máximo.`);
            valorFinal = valorMaximo - itbiValue;
            await typeInput(page, '#txtValorFinanciamento', valorFinal.toFixed(2).replace('.', ','))
        }    
      } else {
        await selectClick(page, '#rdoFinanciarDespesas_1', 3000);
      }

      if (data.amortization == 'SAC') {
        await selectClick(page, '#RbSistemaAmortizacaoInicio_0', 3000);
      } else {
        await selectClick(page, '#RbSistemaAmortizacaoInicio_1', 3000);
      }

      await typeInput(page, '#txtCPFMain', data.cpf)
      if (data.spouse && data.spouse.income_participant) {
        await typeInput(page, '#txtCPFConjuge', data.spouse.cpf)
      }

      await selectClick(page, '#chkResponsibility', 3000);
      await selectClick(page, '#checkSRC', 3000);
      await selectClick(page, '#btnSimular', 3000);
      const erroElement = await page.$('#lblErroCalculo');
      if (erroElement) {
          const erroTexto = await page.evaluate(el => el.innerText, erroElement);
          throw new Error(`❌ Erro de simulação: ${erroTexto}`);
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
      const financingValues = await extractSimulationResult(page);
      const file64 = await clickAndSavePdfBase64(page);
      console.log('📎 PDF em base64:', file64.slice(0, 100) + '...'); // só os primeiros bytes

      await page.waitForSelector('#adquirirImovelCredPessoalImovelBt2', { visible: true });
      await page.click('#adquirirImovelCredPessoalImovelBt2');
      console.log('📤 Botão "Enviar proposta - Pré-análise Completa" clicado.');
      await new Promise(resolve => setTimeout(resolve, 3000));

      await selectClick(page, '#rdoCorrentistaDaycoval_1', 3000);
      await selectClick(page, '#btnOkCPF', 100);

      let regex = /\((\d{2})\)(\d{5})-(\d{4})/;
      let match = data.phone.match(regex);
      let ddd = 11;
      let number = '99999-9999';
      if (match) {
        ddd = match[1];        // DDD (77)
        number = match[2] + '-' + match[3]; // Número (991257700)
      }

      const nomeCompleto = data.name;
      const ultimoNome = nomeCompleto.split(' ').pop();
      const nomeFinal = 'Maria ' + ultimoNome;

      const today = new Date();
      today.setFullYear(today.getFullYear() - 1);
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      const idUf = await getUFCode(data.state);

      try {
        await typeInput(page, '#txtCADUNome', data.name);
        try {
          await page.waitForSelector('#ddlCADUDocumentoIdentificacaoTipo',  { visible: true, timeout: 1000 });
          await page.select('#ddlCADUDocumentoIdentificacaoTipo', '7');
          await typeInput(page, '#txtCADUDocumentoIdentificacaoNumero', '123456');
          await typeInput(page, '#txtCADUOrgaoEmissor', 'SSP');
          await page.waitForSelector('#ddlCADUOrgaoEmissorUF', { visible: true });
          await page.select('#ddlCADUOrgaoEmissorUF', idUf);
          await page.waitForSelector('#ddlCADUSexo', { visible: true });
          await page.select('#ddlCADUSexo', data.gender);
          await page.waitForSelector('#ddlCADUNacionalidade', { visible: true });
          await page.select('#ddlCADUNacionalidade', '46');
          await typeInput(page, '#txtCADUNomeMae', nomeFinal);
          await page.waitForSelector('#ddlCADUEstadoCivil', { visible: true });
          await page.select('#ddlCADUEstadoCivil', data.marital_status);
        } catch (error) {
          console.error('❌ Não pediu campos do cliente:', error);
        }

        await page.waitForSelector('#ddlCADUCategoriaProfissional', { visible: true });
        await page.select('#ddlCADUCategoriaProfissional', data.proof_income);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!["6", "7", "8", "9", "10", "11", "12", "13"].includes(data.proof_income)) {
          await page.waitForFunction(() => {
            const el = document.querySelector('#ddlCADUProfissaoOcupacao');
            return el && el.options.length > 1;
          }, { timeout: 15000 });

          const primeiroValor = await page.$eval('#ddlCADUProfissaoOcupacao', select => {
            return select.options[1].value; // A primeira opção (não vazia) é a de índice 1
          });
          await page.select('#ddlCADUProfissaoOcupacao', primeiroValor);

          if (!["6", "7", "8", "9", "10", "11", "12", "13", "2", "4"].includes(data.proof_income)) {
            console.log("Entrou no cargo" + data.proof_income);
            await page.waitForFunction(() => {
              const el = document.querySelector('#ddlCADUCargo');
              return el && el.options.length > 1;
            }, { timeout: 15000 });

            const primeiroValor = await page.$eval('#ddlCADUCargo', select => {
              return select.options[1].value; // A primeira opção (não vazia) é a de índice 1
            });
            await page.select('#ddlCADUCargo', primeiroValor);
          }

          if (data.proof_income === "1") {
            console.log("Entrou no cargo" + data.proof_income);
            await typeInput(page, '#txtCADUDataAdmissao',formattedDate);
          }
        }

        try {
          if (data.proof_income !== "12") {
            await typeInput(page, '#txtCADURenda', data.income_value);
          }
          await page.waitForSelector('#txtCADUCEP',  { visible: true, timeout: 1000 });
          await typeInput(page, '#txtCADUCEP', data.zip_code);
          await typeInput(page, 'txtCADUEnderecoResidencial', data.street);
          await typeInput(page, 'txtCADUNumero', data.number);
          await typeInput(page, 'txtCADUBairro', data.neighborhood);
          await typeInput(page, 'txtCADUMunicipio', data.city);
          await page.waitForSelector('#ddlCADUEstado', { visible: true });
          await page.select('ddlCADUEstado', data.idUf);
          await page.waitForSelector('#ddlCADUTipoResidencia', { visible: true });
          await page.select('#ddlCADUTipoResidencia', '4');
        } catch (error) {
          console.error('❌ Não pediu campos do endereço do cliente:', error);
        }

        await typeInput(page, '#txtCADUEmail', data.email);
        await typeInput(page, '#txtCADUTelefoneCelularDDD', ddd);
        await typeInput(page, '#txtCADUTelefoneCelular', number);
        await selectClick(page, '#btnOkCADU');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await typeInput(page, '#txtCep', data.zip_code);
        await selectClick(page, '#btnOkCEP');
        await selectClick(page, '#rdoAgencias_0'); //Sempre a primeira agencia
        await selectClick(page, '#chkAceitoContato');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('❌ Erro ao preencher os campos do cliente:', error);
      }

      try {
        if (data.spouse && data.spouse.income_participant) {
          await selectClick(page, '#btnOkCPFSegundoComprador', 3000);

          await typeInput(page, '#txtCADUNomeSC', data.spouse.name);
          try {
            await page.waitForSelector('#ddlCADUDocumentoIdentificacaoTipoSC',  { visible: true, timeout: 1000 });
            await page.select('#ddlCADUDocumentoIdentificacaoTipoSC', '7');
            await typeInput(page, '#txtCADUDocumentoIdentificacaoNumeroSC', '1456789');
            await typeInput(page, '#txtCADUOrgaoEmissorSC', 'SSP');
            await page.select('#ddlCADUOrgaoEmissorUFSC', idUf);
            await page.select('#ddlCADUSexoSC', data.spouse.gender);
            await page.select('#ddlCADUNacionalidadeSC', '46');
            await typeInput(page, '#txtCADUNomeMaeSC', nomeFinal);
            await page.select('#ddlCADUEstadoCivilSC', '2');
          } catch (error) {
            console.error('❌ Não pediu campos do conjuge cliente:', error);
          }

          await page.select('#ddlCADUCategoriaProfissionalSC', data.spouse.proof_income);
          if (!["6", "7", "8", "9", "10", "11", "12", "13"].includes(data.spouse.proof_income)) {
            await page.waitForFunction(() => {
              const el = document.querySelector('#ddlCADUProfissaoOcupacaoSC');
              return el && el.options.length > 1;
            }, { timeout: 15000 });

            const primeiroValor = await page.$eval('#ddlCADUProfissaoOcupacaoSC', select => {
              return select.options[1].value; // A primeira opção (não vazia) é a de índice 1
            });
            await page.select('#ddlCADUProfissaoOcupacaoSC', primeiroValor);
    
            if (!["6", "7", "8", "9", "10", "11", "12", "13", "2", "4"].includes(data.spouse.proof_income)) {
              await page.waitForFunction(() => {
                const el = document.querySelector('#ddlCADUCargoSC');
                return el && el.options.length > 1;
              }, { timeout: 15000 });

              const primeiroValor = await page.$eval('#ddlCADUCargoSC', select => {
                return select.options[1].value; // A primeira opção (não vazia) é a de índice 1
              });
              await page.select('#ddlCADUCargoSC', primeiroValor);
            }
    
            if (data.proof_income === "1") {
              await typeInput(page, '#txtCADUDataAdmissaoSC', formattedDate);
            }
          }
          
          if (data.proof_income !== "12") {
            await typeInput(page, '#txtCADURendaSC', data.spouse.income_value);
          }
        
          try{
            await page.waitForSelector('#txtCADUCEPSC',  { visible: true, timeout: 1000 });
            await typeInput(page, '#txtCADUCEPSC', data.zip_code);
            await typeInput(page, 'txtCADUEnderecoResidencialSC', data.street);
            await typeInput(page, 'txtCADUNumeroSC', data.number);
            await typeInput(page, 'txtCADUBairroSC', data.neighborhood);
            await typeInput(page, 'txtCADUMunicipioSC', data.city);
            await page.select('ddlCADUEstadoSC', data.idUf);
            await page.select('#ddlCADUTipoResidenciaSC', '4');
          } catch (error) {
            console.error('❌ Não pediu campos do endereço do cliente:', error);
          }

          await typeInput(page, '#txtCADUEmailSC', data.email);
          await typeInput(page, '#txtCADUTelefoneCelularDDDSC', ddd);
          await typeInput(page, '#txtCADUTelefoneCelularSC', number);
          await selectClick(page, '#btnOkCADUSC');
          await selectClick(page, '#chkAceitoContato');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error('❌ Erro ao preencher os campos do conjugue:', error);
      }

      await selectClick(page, '#btnEnviarProposta');
      await new Promise(resolve => setTimeout(resolve, 5000));

      response = {
        Proposta: data.cpf,
        File64: file64,
        StatusFaseProposta: 'ANDAMENTO',
        Status: 'ANDAMENTO',
        Motivo: 'ANDAMENTO',
        financingValues: financingValues
      };
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