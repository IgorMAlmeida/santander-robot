import simulation from "../../services/Financiamento/ItauImovel/index.js";
import ControllerResponse from '../../utils/ControllerResponse.js';

export async function ItauImovelFinancial(req, res) {
    try {
        const data = req?.body?.data;

        if (!data) {
            throw new Error("Faltou os dados da proposta");
        }

        const result = await simulation(data);

        if (!result.status) {
            return ControllerResponse.error(res, result);
        }

        return ControllerResponse.success(res, result.response);
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
}
