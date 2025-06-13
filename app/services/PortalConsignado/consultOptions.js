import { GovMT } from "./Convenios/GovMT.js";
import { GovSP } from "./Convenios/GovSP.js";
import { MunSP } from "./Convenios/MunSP.js";
import { scrapingGovMT } from "./Scrapping/scrapingGovMT.js";
import { scrapingGovSP } from "./Scrapping/scrapingGovSP.js";
import { scrapingMunSP } from "./Scrapping/scrapingMunSP.js";

export async function consultOptions(page, params) {
	const options = {
		'MunSP': () => MunSP(page, params),
		'GovSP': () => GovSP(page, params),
		'GovMT': () => GovMT(page, params),
	};

	if (!options[params.destiny]) {
		throw new Error(`Invalid consult type: ${params.destiny}`);
	}

	return await options[params.destiny]();
}

export async function scrappingOptions(page, destiny) {
	const options = {
		'MunSP': () => scrapingMunSP(page),
		'GovSP': () => scrapingGovSP(page),
		'GovMT': () => scrapingGovMT(page),
	};

	if (!options[destiny]) {
		throw new Error(`Invalid scraping option: ${destiny}`);
	}

	return await options[destiny]();
}