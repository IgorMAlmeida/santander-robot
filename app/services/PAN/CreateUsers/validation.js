import { z } from "zod";
import { PAN_CONFIG } from "./config.js";
import { CertificatesError } from "../../../errors/CertificatesError.js";
import { CertificatesConsult } from "../../Common/Certificates/CertificatesConsult.js";
import { certificatesSchema, createUserPANSchema } from "./schema.js";

const validCertificates = {
  'LGPD'          : false,
  'Correspondente':false,
  'PLDFT'         :false
};

export function validateBody(body) {
  try {
    return createUserPANSchema.parse(body);
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

export async function validateCertificates(page, body) {
  try {
    const certificates = await CertificatesConsult(page, body, validCertificates);
    const validatedCertificates = certificatesSchema.parse(certificates);
    
    if (!validatedCertificates.status) {
      if (validatedCertificates.isCertificateError) {
        throw new CertificatesError(
          validatedCertificates.message || "Erro no certificado",
          validatedCertificates.data
        );
      }
      throw new Error(
        validatedCertificates.data || PAN_CONFIG.ERRORS.CERTIFICATES_FAILED
      );
    }
    
    return validatedCertificates;
  } catch (error) {
    console.log(error);
    if (error instanceof CertificatesError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new Error(`${PAN_CONFIG.ERRORS.CERTIFICATES_FAILED}: Resposta inválida do serviço de certificados`);
    }
    throw new Error(`${PAN_CONFIG.ERRORS.CERTIFICATES_FAILED}: ${error.message}`);
  }
}
