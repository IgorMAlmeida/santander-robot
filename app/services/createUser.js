import { CreateController } from '../services/BMG/CreateUsers/CreateController.js';
import { CreateUserC6 } from './C6/CreateUsers/index.js';
import { CreateControllerPan } from './PAN/CreateUsers/CreateControllerPan.js';
import { CreateControllerQueroMais } from './QueroMais/CreateUsers/CreateControllerQueroMais.js';

const BANKS = {
  BMG: (body) => CreateController(body),
  C6: (body) => CreateUserC6(body),
  PAN: (body) => CreateControllerPan(body),
  QUEROMAIS: (body) => CreateControllerQueroMais(body),
};

export const BANKS_LIST = Object.keys(BANKS);
export const BANKS_LIST_LOWERCASE = BANKS_LIST.map((bank) => bank.toLowerCase());

export async function CreateUser(bank, body) {
  const bankFunction = BANKS[bank];
  return await bankFunction(body);
}