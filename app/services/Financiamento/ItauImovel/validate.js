export default function validate(data) {
  const errors = {};

  const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/u;
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
  const phonePattern = /^\(\d{2}\)\d{4,5}-\d{4}$/u;
  const birthDatePattern = /^\d{2}\/\d{2}\/\d{4}$/u;

  if (!data.cpf || typeof data.cpf !== "string" || !cpfPattern.test(data.cpf)) {
    errors.cpf = "CPF inválido";
  }

  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.name = "Nome é obrigatório";
  }

  if (
    !data.email ||
    typeof data.email !== "string" ||
    !emailPattern.test(data.email)
  ) {
    errors.email = "Email inválido";
  }

  if (
    !data.phone ||
    typeof data.phone !== "string" ||
    !phonePattern.test(data.phone)
  ) {
    errors.phone = "Telefone inválido";
  }

  if (
    data.type_property !== "RESIDENCIAL" &&
    data.type_property !== "COMERCIAL"
  ) {
    errors.type_property = "Tipo de imóvel inválido";
  }

  if (
    typeof data.property_value !== "string" ||
    isNaN(parseFloat(data.property_value)) ||
    parseFloat(data.property_value) <= 0
  ) {
    errors.property_value = "Valor do imóvel deve ser um número positivo";
  }
  
  if (
    typeof data.input_value !== "string" ||
    isNaN(parseFloat(data.input_value)) ||
    parseFloat(data.input_value) <= 0
  ) {
    errors.input_value = "Valor de entrada deve ser um número positivo";
  }
  
  if (!errors.property_value && !errors.input_value) {
    const propertyValue = parseFloat(data.property_value);
    const inputValue = parseFloat(data.input_value);
  
    const minPercentage = data.property_type === "Comercial" ? 0.5 : 0.1;
    const min = propertyValue * minPercentage;
    const max = propertyValue * 0.9;

    if (data.property_type === "Comercial") {
      if (inputValue < min) {
        errors.input_value = `Valor de entrada deve ser no mínimo 50% do valor do imóvel para imóveis comerciais (${min.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )})`;
      }
    }

    if (data.property_type === "Residencial") {
      if (inputValue < min || inputValue > max) {
        errors.input_value = `Valor de entrada deve ser entre 10% e 90% do valor do imóvel para imóveis residenciais (${min.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )} - ${max.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })})`;
      }
    }
  }

  if (
    !data.birth_date ||
    typeof data.birth_date !== "string" ||
    !birthDatePattern.test(data.birth_date)
  ) {
    errors.birth_date = "Data de nascimento inválida";
  }

  if (
    typeof data.financing_term !== "number" ||
    !Number.isInteger(data.financing_term) ||
    data.financing_term < 1 ||
    (data.property_type === "Comercial" && data.financing_term > 240) ||
    (data.property_type === "Residencial" && data.financing_term > 420)
  ) {
    errors.financing_term =
      data.property_type === "Comercial"
        ? "Prazo deve ser um inteiro entre 1 e 240 meses para imóveis comerciais"
        : "Prazo deve ser um inteiro entre 1 e 420 meses para imóveis residenciais";
  }

  if (
    !data.marital_status ||
    typeof data.marital_status !== "string" ||
    data.marital_status.trim().length === 0
  ) {
    errors.marital_status = "Estado Civil é obrigatório";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}