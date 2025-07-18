import { z } from "zod";
import { C6_CONFIG } from "./config.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import { CertificatesConsult } from "../../Common/Certificates/CertificatesConsult.js";
import { certificatesSchema, createUserC6Schema } from "./schema.js";

export function validateBody(body) {
  try {
    return createUserC6Schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
        const firstError = JSON.parse(error)[0];
        throw new Error(`${C6_CONFIG.ERRORS.INVALID_PARAMS}`, {
            cause: firstError.message,
        });
    }
    throw new Error(`${C6_CONFIG.ERRORS.INVALID_PARAMS}: ${error.message}`);
  }
}

export async function validateCertificates(page, body) {
  try {
    const certificates = await CertificatesConsult(page, body);
    const validatedCertificates = certificatesSchema.parse(certificates);
    
    if (!validatedCertificates.status) {
      if (validatedCertificates.isCertificateError) {
        throw new CertificatesError(
          validatedCertificates.message || "Erro no certificado",
          validatedCertificates.data
        );
      }
      throw new Error(
        validatedCertificates.data || C6_CONFIG.ERRORS.CERTIFICATES_FAILED
      );
    }
    
    return validatedCertificates;
  } catch (error) {
    console.log(error);
    if (error instanceof CertificatesError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new Error(`${C6_CONFIG.ERRORS.CERTIFICATES_FAILED}: Resposta inválida do serviço de certificados`);
    }
    throw new Error(`${C6_CONFIG.ERRORS.CERTIFICATES_FAILED}: ${error.message}`);
  }
}
