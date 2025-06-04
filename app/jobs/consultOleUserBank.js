import ApiService from "../services/api.service.js";
import { ProposalConsult } from "../controllers/OlaController.js";

export const consultOleUserBank = async () => {
    try {
        const response = await ApiService.get(`/proposals/ole/file_to_process`);

        if(!response.status) {
            throw new Error(response.message);
        }
        
        const data = response.data;

        await ProposalConsult(data.file_id, data.proposals);

        return {
            status: true,
            message: "Consultou o usuário do OLE"
        };
    } catch (error) {
        console.error(error.message);
        return {
            status: false,
            message: error.message
        };
    }
};