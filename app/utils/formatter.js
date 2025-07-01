export const formatCpf = (cpf) => {
  const justNumbers = cpf.replace(/\D/g, "");
  return justNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};