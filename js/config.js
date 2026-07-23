"use strict";

const UNIT = {
  type: "PRONTO ATENDIMENTO MÉDICO",
  name: "UPA Tiago Cardoso Santos",
  city: "Mateus Leme, MG",
  address: "Rua Levir da Silva, 15, Vale Verde",
  phone: "(31) 3208-2019",
  logo: "./UPA24h.jpg",
  footer: "./rodape.png"
};

function validateAppConfig() {
  const errors = [];

  if (typeof UNIT === "undefined" || !UNIT || typeof UNIT !== "object") {
    console.error("[config] UNIT ausente ou inválido.");
    return false;
  }

  function requireNonEmptyString(key) {
    const value = UNIT[key];
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`[config] UNIT.${key} deve ser uma string não vazia.`);
    }
  }

  function requireString(key) {
    if (typeof UNIT[key] !== "string") {
      errors.push(`[config] UNIT.${key} deve ser uma string.`);
    }
  }

  requireNonEmptyString("type");
  requireNonEmptyString("name");
  requireNonEmptyString("city");
  requireString("address");
  requireString("phone");
  requireNonEmptyString("logo");
  requireNonEmptyString("footer");

  if (errors.length > 0) {
    errors.forEach((message) => {
      console.error(message);
    });
    return false;
  }

  return true;
}

validateAppConfig();
