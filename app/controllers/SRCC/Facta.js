import srcc from '../../services/SRCC/Facta/index.js';
import ControllerResponse from '../../utils/ControllerResponse.js';

export async function FactaSRCC(req, res) {
    try {
        const people = req?.body?.people;

        if (!people) {
            throw new Error("Faltou as propostas");
        }

        const result = await srcc(people);

        return ControllerResponse.success(res, result);
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
};
