import { z } from "zod";
import { QUERO_MAIS_CONFIG } from "../config.js";
import { unlockUserQueroMaisSchema } from "./schema.js";

export function validateBody(body) {
  try {
    return unlockUserQueroMaisSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
        const firstError = JSON.parse(error)[0];
        throw new Error(`${QUERO_MAIS_CONFIG.ERRORS.INVALID_PARAMS}`, {
            cause: firstError.message,
        });
    }
    throw new Error(`${QUERO_MAIS_CONFIG.ERRORS.INVALID_PARAMS}: ${error.message}`);
  }
}

