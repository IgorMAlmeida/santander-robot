export default function validate(data) {
  const errors = {};

  const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/u;
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
  const phonePattern = /^\(\d{2}\) \d{4,5}-\d{4}$/u;
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
    data.property_type !== "Residencial" &&
    data.property_type !== "Comercial"
  ) {
    errors.property_type = "Tipo de imóvel inválido";
  }

  if (
    typeof data.property_value !== "number" ||
    isNaN(data.property_value) ||
    data.property_value <= 0
  ) {
    errors.property_value = "Valor do imóvel deve ser um número positivo";
  }

  if (
    typeof data.input_value !== "number" ||
    isNaN(data.input_value) ||
    data.input_value <= 0
  ) {
    errors.input_value = "Valor de entrada deve ser um número positivo";
  }

  if (!errors.property_value && !errors.input_value) {
    const minPercentage = data.property_type === "Comercial" ? 0.5 : 0.1;
    const min = data.property_value * minPercentage;
    const max = data.property_value * 0.9;

    if (data.property_type === "Comercial") {
      if (data.input_value < min) {
        errors.input_value = `Valor de entrada deve ser no mínimo 50% do valor do imóvel para imóveis comerciais (${min.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )})`;
      }
    }

    if (data.property_type === "Residencial") {
      if (data.input_value < min || data.input_value > max) {
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

  const currentDate = new Date();
  const splittedBirthDate = data.birth_date.split("/");
  const birthDate = new Date(splittedBirthDate[2], splittedBirthDate[1] - 1, splittedBirthDate[0]);
  const age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  const agePlusFinancingTerm = age + data.financing_term;

  if (agePlusFinancingTerm > 80 || (agePlusFinancingTerm === 80 && monthDiff >= 6)) {
    errors.financing_term =
      "A soma da idade com o prazo de financiamento não pode ultrapassar 80 anos e 6 meses";
  }

  if (
    typeof data.financing_term !== "number" ||
    !Number.isInteger(data.financing_term) ||
    data.financing_term < 1 ||
    (data.property_type === "Comercial" && data.financing_term > 20) ||
    (data.property_type === "Residencial" && data.financing_term > 35)
  ) {
    errors.financing_term =
      data.property_type === "Comercial"
        ? "Prazo deve ser um inteiro entre 1 e 20 anos para imóveis comerciais"
        : "Prazo deve ser um inteiro entre 1 e 35 anos para imóveis residenciais";
  }

  if (typeof data.has_property !== "boolean") {
    errors.has_property = "Indicação de imóvel já adquirido é obrigatória";
  }

  const validTimes = ["up_to_1_month", "up_to_3_months", "more_than_3_months"];

  if (
    data?.time_acquire_property &&
    !validTimes.includes(data?.time_acquire_property)
  ) {
    errors.time_acquire_property = "Tempo de aquisição inválido";
  }

  if (data.insurance_company !== "itau" && data.insurance_company !== "tokyo") {
    errors.insurance_company = "Seguradora inválida";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}