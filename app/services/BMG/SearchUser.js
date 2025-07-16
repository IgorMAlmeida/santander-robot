import { clickElementByXpath, sleep, checkElementAndText, } from "../../../utils.js";

export async function searchUser(page, params) {
  try {
    const [cpf, user] = params;
    await page.type('::-p-xpath(/html/body/form/table[1]/tbody/tr[2]/td/table/tbody/tr[4]/td[2]/input)', cpf);
    await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
    console.log('buscou em tdos botoes');
    await sleep(1000);

    let erroNotFound = await checkElementAndText(page, '/html/body/form/table[3]/tbody/tr/td/span[1]'); //nenhum registro encontrado
    if (erroNotFound.status) {
      console.log("entrou em not found do 'SearchUser'")
      throw new Error(erroNotFound.text);
    }

    let itensPerPage = await checkElementAndText(page, '/html/body/form/table[3]/tbody/tr/td/div/span[1]');
    if (itensPerPage.status) {
      let itensPerPageText = itensPerPage.text;
      console.log('itensPerPage:', itensPerPageText);
      const parts = itensPerPageText.split(' de ');
      console.log('parts', parts);

      if (parts.length >= 2) {
        const totalPages = parseInt(parts[1].trim());
        if (!isNaN(totalPages) && totalPages > 1 && user !== '') {
          await page.type('::-p-xpath(/html/body/form/table[1]/tbody/tr[2]/td/table/tbody/tr[2]/td[2]/input)', user); //busca por usuario
          await clickElementByXpath(page, '//*[@id="buttonLink"]/span');
          await sleep(1000);
          erroNotFound = await checkElementAndText(page, '/html/body/form/table[3]/tbody/tr/td/span[1]'); //nenhum registro encontrado
          if (erroNotFound.status) {
            console.log("entrou em not found do 'SearchUser'")
            throw new Error(erroNotFound.text);
          }
        }
      }
    }

    return {
      status: true,
      data: page,
      message: 'User found!'
    };
  } catch (error) {
    console.error('Error during searching user:', error);
    return {
      status: false,
      data: error,
      message: 'Error during searching user'
    };
  }
}