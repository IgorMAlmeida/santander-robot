import HttpService from "../../../utils/HttpService.js";
import { format } from "date-fns";

export default async function sendConsult(cpf, benefit, cookie, gresponse) {
  try {
    const response = await HttpService.post(
      "https://desenv.facta.com.br/sistemaNovo/ajax/ajax_consulta_srcc.php",
      {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://desenv.facta.com.br",
        Referer: "https://desenv.facta.com.br/sistemaNovo/consultaSrcc.php",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookie,
      },
      {
        acao: "buscaDadosSRCC",
        cpf: cpf,
        empregador: "1",
        dataBase: format(new Date(), "dd/MM/yyyy"),
        beneficio: benefit,
        grecaptcha_response: gresponse,
      }
    );

    return response;
  } catch (err) {
    console.error("Error in consultSRCC:", err);
    return false;
  }
}
