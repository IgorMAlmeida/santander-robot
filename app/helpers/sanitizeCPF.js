export async function sanitizeCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return '';
  
  const sanitized = cpf.replace(/[^\d]/g, '');
  
  if (sanitized.length !== 11 || /^(\d)\1{10}$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}
