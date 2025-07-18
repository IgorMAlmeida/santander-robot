import { initialize } from "../../services/Approval/InitializePuppeteer.js";
import { createUsers } from "../../services/C6/CreateUsers/index.js";
import logger from "../../utils/logger.js";
import { z } from "zod";

const bodySchema = z.object({
  cpf: z.string().min(11).max(11),
  name: z.string().min(1),
  // email: z.string().email(),
  // phone: z.string().min(11).max(11),
  // birth_date: z.string().min(8).max(8),
  // mothers_name: z.string().min(1)
});

export default async function C6CreateUsersController(request, response) {
    const { page, browser } = await initialize();
    
    try {
        const body = bodySchema.parse(request.body);

        await createUsers(page, body);

        return response.status(200).json({ message: "Usuário criado com sucesso" });
    } catch (error) {
        logger.logError("Erro ao criar usuário", error);
        console.log(error);
        await browser.close();
        return response.status(500).json({ message: "Erro ao criar usuário" });
    }
}