import { z } from "zod";
import { PAN_CONFIG } from "../config.js";
import { unlockUserPANSchema } from "./schema.js";

export function validateBody(body) {
  try {
    return unlockUserPANSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
        const firstError = JSON.parse(error)[0];
        throw new Error(`${PAN_CONFIG.ERRORS.INVALID_PARAMS}`, {
            cause: firstError.message,
        });
    }
    throw new Error(`${PAN_CONFIG.ERRORS.INVALID_PARAMS}: ${error.message}`);
  }
}
