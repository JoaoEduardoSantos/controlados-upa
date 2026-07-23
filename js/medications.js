"use strict";

/**
 * Catálogo único de medicamentos disponíveis.
 * Scripts clássicos (sem ES Modules) para compatibilidade com file://.
 * Cada item é um medicamento completo (sem options / optionGroups).
 *
 * Ordem de exibição dos grupos na UI (índice = prioridade).
 * Classes ausentes no índice ficam depois, na ordem de primeira aparição.
 *
 * Dentro de cada grupo, os itens são ordenados por `order` (menor = primeiro).
 */
const DRUG_CLASS_ORDER = [
  "AINE",
  "Opioide",
  "Benzodiazepínico",
  "IBP",
  "Catecolamina",
];

const MEDICATIONS = [
  {
    id: "cetoprofeno-ev-bolsa",
    label: "Cetoprofeno",
    name: "Cetoprofeno (1 mg/mL)",
    drugClass: "AINE",
    order: 1,
    route: "EV",
    posology: "1 bolsa",
    dilution: "1 bolsa de 100mL, sem diluição",
    indication: "Dor intensa",
  },
  {
    id: "tramadol-ev-100mg",
    label: "Tramadol",
    name: "Tramadol (50 mg/mL)",
    drugClass: "Opioide",
    order: 1,
    route: "EV/IM",
    posology: "1 ampola de 2 mL (100 mg)",
    dilution:
      "Se EV: 1 ampola de 2 mL (100 mg) diluída em 100 mL de SF 0,9%, EV lento; Se IM: 1 ampola de 2mL, IM, sem diluição",
    indication: "Dor intensa",
  },
  {
    id: "morfina-ev",
    label: "Morfina",
    name: "Morfina (10 mg/mL)",
    drugClass: "Opioide",
    order: 2,
    route: "EV",
    posology: "1 ampola de 1 mL (10 mg)",
    dilution: "Diluir 1 ampola de 1 mL em 9mL de SF 0,9%",
    indication: "Dor intensa",
  },
  {
    id: "fentanil-ev-sedacao",
    label: "Fentanil",
    name: "Fentanil (0,0785 mg/mL)",
    drugClass: "Opioide",
    order: 3,
    route: "EV",
    posology: "4 ampolas",
    dilution:
      "4 ampolas de 5 mL (total de 20 mL) diluídas em 180mL de SF 0,9%, EV em BIC",
    indication: "Sedação contínua",
  },
  {
    id: "diazepam-vo-5mg",
    label: "Diazepam",
    name: "Diazepam (5 mg)",
    drugClass: "Benzodiazepínico",
    order: 1,
    route: "5mg VO",
    posology: "1 comprimido de 5 mg",
    dilution: "Sem diluição",
    indication: "Agitação e ansiedade",
  },
  {
    id: "diazepam-vo-10mg",
    label: "Diazepam",
    name: "Diazepam (10 mg)",
    drugClass: "Benzodiazepínico",
    order: 2,
    route: "10mg VO",
    posology: "1 comprimido de 10 mg",
    dilution: "Sem diluição",
    indication: "Agitação e ansiedade",
  },
  {
    id: "diazepam-ev",
    label: "Diazepam",
    name: "Diazepam (5 mg/mL)",
    drugClass: "Benzodiazepínico",
    order: 3,
    route: "EV/IM",
    posology: "1 ampola de 2 mL (10 mg)",
    dilution: "1 ampola (2mL) em 8mL de SF 0,9%",
    indication: "Agitação e ansiedade",
  },
  {
    id: "midazolam-ev-sedacao",
    label: "Midazolam",
    name: "Midazolam (1 mg/mL)",
    drugClass: "Benzodiazepínico",
    order: 4,
    route: "EV",
    posology: "4 ampolas",
    dilution:
      "4 ampolas de 5 mL (total de 20 mL) diluídas em 180mL de SF 0,9%, EV em BIC",
    indication: "Sedação contínua",
  },
  {
    id: "omeprazol-ev",
    label: "Omeprazol",
    name: "Omeprazol (40 mg/frasco-ampola)",
    drugClass: "IBP",
    order: 1,
    route: "EV",
    posology: "1 frasco-ampola (40 mg)",
    dilution: "Reconstituir 1  frasco-ampola em 10mL de SF 0,9%",
    indication: "Epigastralgia",
  },
  {
    id: "adrenalina-ev",
    label: "Adrenalina / Epinefrina",
    name: "Adrenalina / Epinefrina (1 mg/mL)",
    drugClass: "Catecolamina",
    order: 1,
    route: "EV",
    posology: "1 ampola de 1 mL (1 mg)",
    dilution: "Sem diluição",
    indication: "PCR",
  },
];

function validateMedicationCatalog() {
  const errors = [];

  if (!Array.isArray(MEDICATIONS)) {
    console.error("[medications] MEDICATIONS deve ser um array.");
    return false;
  }

  const seenIds = new Set();

  MEDICATIONS.forEach((item, index) => {
    const prefix = `[medications] item[${index}]`;

    if (!item || typeof item !== "object") {
      errors.push(`${prefix}: entrada inválida.`);
      return;
    }

    if (!item.id || typeof item.id !== "string") {
      errors.push(`${prefix}: id obrigatório.`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${prefix}: id duplicado "${item.id}".`);
    } else {
      seenIds.add(item.id);
    }

    if (!item.label || typeof item.label !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): label obrigatório.`);
    }

    if (!item.name || typeof item.name !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): name obrigatório.`);
    }

    if (!item.drugClass || typeof item.drugClass !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): drugClass obrigatório.`);
    }

    if (typeof item.order !== "number" || !Number.isFinite(item.order)) {
      errors.push(`${prefix} (${item.id || "?"}): order numérico obrigatório.`);
    }
  });

  if (errors.length > 0) {
    errors.forEach((message) => {
      console.error(message);
    });
    return false;
  }

  return true;
}

validateMedicationCatalog();
