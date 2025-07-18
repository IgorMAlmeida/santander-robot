import { z } from "zod";
import { C6_CONFIG } from "./config.js";

const errorMessage = (error) => {
  if(error.code === "invalid_type") {
    return `O campo ${error.path} deve ser do tipo ${error.expected}`;
  }
  return `O campo ${error.path} é obrigatório`;
}

export const cpfSchema = z
  .string({
    error: errorMessage,
  })
  .min(C6_CONFIG.VALIDATION.CPF_MIN_LENGTH, {
    message: `CPF deve ter no mínimo ${C6_CONFIG.VALIDATION.CPF_MIN_LENGTH} caracteres`,
  })
  .max(C6_CONFIG.VALIDATION.CPF_MAX_LENGTH, {
    message: `CPF deve ter no máximo ${C6_CONFIG.VALIDATION.CPF_MAX_LENGTH} caracteres`,
  })
  .regex(C6_CONFIG.VALIDATION.CPF_REGEX, {
    message: "Formato de CPF inválido. Use: 000.000.000-00 ou 00000000000",
  })
  .transform((cpf) => cpf.replace(/[^\d]/g, ""))
  .refine((cpf) => cpf.length === C6_CONFIG.VALIDATION.CPF_CLEANED_LENGTH, {
    message: `CPF deve conter exatamente ${C6_CONFIG.VALIDATION.CPF_CLEANED_LENGTH} dígitos`,
  })
  .refine(
    (cpf) => {
      return !C6_CONFIG.VALIDATION.INVALID_CPFS.includes(cpf);
    },
    {
      message: "CPF inválido",
    }
  );

export const createUserC6Schema = z.object({
  cpf: cpfSchema,
  name: z.string({
    error: errorMessage,
  }),
  email: z.string({
    error: errorMessage,
  }),
  phone: z.string({
    error: errorMessage,
  }),
  birth_date: z.string({
    error: errorMessage,
  }),
  mothers_name: z.string({
    error: errorMessage,
  }),
});

export const certificatesSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  isCertificateError: z.boolean().optional(),
});
