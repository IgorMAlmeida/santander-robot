import { BANKS_LIST, CreateUser } from '../services/createUser.js';
import { z } from 'zod';

const schema = z.object({
  bank: z.literal(BANKS_LIST),
});

export async function CreateBankUser(request, response) {
  try {
    const body = schema.parse(request.body);

    const result = await CreateUser(body.bank, request.body);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
