import { z } from "zod";
import { PAN_CONFIG } from "../config.js";

const errorMessage = (error) => {
  if (error.code === "invalid_type") {
    return `O campo ${error.path} deve ser do tipo ${error.expected}`;
  }
  return `O campo ${error.path} é obrigatório`;
}

// Schemas individuais para reutilização
export const cpfSchema = z
  .string({
    error: errorMessage,
  })
  .min(PAN_CONFIG.VALIDATION.CPF_MIN_LENGTH, {
    message: `CPF deve ter no mínimo ${PAN_CONFIG.VALIDATION.CPF_MIN_LENGTH} caracteres`,
  })
  .max(PAN_CONFIG.VALIDATION.CPF_MAX_LENGTH, {
    message: `CPF deve ter no máximo ${PAN_CONFIG.VALIDATION.CPF_MAX_LENGTH} caracteres`,
  })
  .regex(PAN_CONFIG.VALIDATION.CPF_REGEX, {
    message: "Formato de CPF inválido. Use: 000.000.000-00 ou 00000000000",
  })
  .transform((cpf) => cpf.replace(/[^\d]/g, ""))
  .refine((cpf) => cpf.length === PAN_CONFIG.VALIDATION.CPF_CLEANED_LENGTH, {
    message: `CPF deve conter exatamente ${PAN_CONFIG.VALIDATION.CPF_CLEANED_LENGTH} dígitos`,
  })
  .refine(
    (cpf) => {
      return !PAN_CONFIG.VALIDATION.INVALID_CPFS.includes(cpf);
    },
    {
      message: "CPF inválido",
    }
  );

export const nameSchema = z
  .string({
    error: errorMessage,
  })
  .min(2, {
    message: "Nome deve ter pelo menos 2 caracteres",
  })
  .max(100, {
    message: "Nome deve ter no máximo 100 caracteres",
  })


export const emailSchema = z
  .string({
    error: errorMessage,
  })
  .email({
    message: "Formato de email inválido",
  });

export const phoneSchema = z
  .union([z.string(), z.number()])
  .transform((phone) => String(phone))
  .refine((phone) => phone.length >= 10 && phone.length <= 11, {
    message: "Telefone deve ter entre 10 e 11 dígitos",
  });

export const cepSchema = z
  .union([z.string(), z.number()])
  .transform((cep) => String(cep).replace(/[^\d]/g, ""))
  .refine((cep) => cep.length === 8, {
    message: "CEP deve conter exatamente 8 dígitos",
  });

export const birthDateSchema = z
  .string({
    error: errorMessage,
  })
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: "Data de nascimento deve estar no formato DD/MM/AAAA",
  })
  .refine((date) => {
    const [day, month, year] = date.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 120;
  }, {
    message: "Idade deve ser entre 18 e 120 anos",
  });

export const rgCnhSchema = z
  .union([z.string(), z.number()])
  .transform((rg) => String(rg).replace(/[^\d]/g, ""))
  .refine((rg) => rg.length === 0 || (rg.length >= 7 && rg.length <= 11), {
    message: "RG/CNH deve ter entre 7 e 11 dígitos",
  });


export const stateAcronymSchema = z
  .string({
    error: errorMessage,
  })
  .length(2, {
    message: "Sigla do estado deve ter exatamente 2 caracteres",
  })
  .regex(/^[A-Z]{2}$/, {
    message: "Sigla do estado deve conter apenas letras maiúsculas",
  });

export const bankSchema = z
  .string({
    error: errorMessage,
  })
  .refine((bank) => ["pan", "bmg", "c6"].includes(bank.toLowerCase()), {
    message: "Banco deve ser: pan, bmg ou c6",
  });

export const unlockUserPANSchema = z.object({
  cpf: cpfSchema,
  name: nameSchema,
  bank: bankSchema,
  state_acronym: stateAcronymSchema,
});
