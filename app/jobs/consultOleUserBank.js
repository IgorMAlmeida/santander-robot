import ApiService from "../services/api.service.js";
import { ProposalConsult } from "../controllers/OlaController.js";
import ControllerResponse from "../utils/ControllerResponse.js";

export const consultOleUserBank = async (req, res) => {
    try {
        const response = await ApiService.get(`/proposals/ole/file_to_process`);

        if(!response.status) {
            throw new Error(response.message);
        }
        
        const data = response.data;

        await ProposalConsult(data.file_id, data.proposals);

        return ControllerResponse.success(res, {
          message: "Consultou o usuário do OLE",
        });
    } catch (error) {
        return ControllerResponse.error(res, error);
    }
};