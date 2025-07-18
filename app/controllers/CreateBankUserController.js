import { BANKS_LIST_LOWERCASE, CreateUser } from "../services/createUser.js";
import ControllerResponse from "../utils/ControllerResponse.js";
import { z } from "zod";

const schema = z.object({
  bank: z.literal(BANKS_LIST_LOWERCASE),
});

export async function CreateBankUserController(request, response) {
  try {
    const params = schema.parse(request.params);

    const result = await CreateUser(params.bank.toUpperCase(), request.body);

    if (result?.isCertificateError) {
      return ControllerResponse.certificateError(response, result.response, result.data);
    }

    if (!result?.status) {
      throw new Error(result.response);
    }

    return ControllerResponse.success(response, result);
  } catch (err) {
    return ControllerResponse.error(response, err);
  }
}
