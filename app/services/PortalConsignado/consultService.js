import { clickElementByXpath, getByXpath, sleep } from "../../../utils.js";
import { consultOptions, scrappingOptions } from "./consultOptions.js"

export async function consultService(page, consultParams) {
  try {
    console.log("Antes consult");
    const consult = await consultOptions(page ,consultParams);
    if(!consult.status){
        throw new Error(consult.data)
    }
    console.log("Consult feito");
    
    console.log("Antes Scrap");
    const scrappig = await scrappingOptions(consult.data, consultParams.destiny);
    if(!scrappig.status){
        throw new Error(scrappig.data)
    }
    console.log("Depois scrap");

    return { 
      status: true,
      data: scrappig.data
    }
  }catch (error) {
    console.error(error)
    return { 
      status: false, 
      data: error.message
    };
  }
}