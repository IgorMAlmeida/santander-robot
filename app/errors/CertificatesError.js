export class CertificatesError extends Error {
  constructor(message, data = {}) {
    super(message);
    this.data = data;
    this.name = 'CertificatesError';

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CertificatesError);
    }
  }

  
}