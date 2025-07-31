import { z } from "zod";
import { QUERO_MAIS_CONFIG } from "../config.js";

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
  .min(QUERO_MAIS_CONFIG.VALIDATION.CPF_MIN_LENGTH, {
    message: `CPF deve ter no mínimo ${QUERO_MAIS_CONFIG.VALIDATION.CPF_MIN_LENGTH} caracteres`,
  })
  .max(QUERO_MAIS_CONFIG.VALIDATION.CPF_MAX_LENGTH, {
    message: `CPF deve ter no máximo ${QUERO_MAIS_CONFIG.VALIDATION.CPF_MAX_LENGTH} caracteres`,
  })
  .regex(QUERO_MAIS_CONFIG.VALIDATION.CPF_REGEX, {
    message: "Formato de CPF inválido. Use: 000.000.000-00 ou 00000000000",
  })
  .transform((cpf) => cpf.replace(/[^\d]/g, ""))
  .refine((cpf) => cpf.length === QUERO_MAIS_CONFIG.VALIDATION.CPF_CLEANED_LENGTH, {
    message: `CPF deve conter exatamente ${QUERO_MAIS_CONFIG.VALIDATION.CPF_CLEANED_LENGTH} dígitos`,
  })
  .refine(
    (cpf) => {
      return !QUERO_MAIS_CONFIG.VALIDATION.INVALID_CPFS.includes(cpf);
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
  });

export const bankSchema = z
  .string({
    error: errorMessage,
  })
  .refine((bank) => ["pan", "bmg", "c6", "queromais"].includes(bank.toLowerCase()), {
    message: "Banco deve ser: pan, bmg, queromais ou c6",
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

export const unlockUserQueroMaisSchema = z.object({
  cpf: cpfSchema,
  name: nameSchema,
  bank: bankSchema,
});
