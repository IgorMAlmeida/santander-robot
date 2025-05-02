import simulation from "../../services/Financiamento/Itaú/index.js";
import ControllerResponse from '../../utils/ControllerResponse.js';

export async function ItauFinancial(req, res) {
    try {
        const data = req?.body?.data;

        if (!data) {
            throw new Error("Faltou a proposta");
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
