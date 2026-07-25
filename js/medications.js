"use strict";

/**
 * Catálogo único de medicamentos disponíveis.
 * Scripts clássicos (sem ES Modules) para compatibilidade com file://.
 * Cada item é um medicamento completo (sem options / optionGroups).
 *
 * A UI agrupa por `indication`. `drugClass` aparece no card (acima do nome).
 *
 * Ordem dos grupos: índice em INDICATION_ORDER (menor = primeiro).
 * Indicações ausentes ficam depois, em ordem alfabética.
 *
 * Ordem dentro do grupo: `order` do medicamento (menor = primeiro).
 * O array abaixo segue essa mesma ordem (indicação → order).
 *
 * `unitSingular` / `unitPlural`: unidade de dispensação
 * (ex.: "ampola"/"ampolas", "comprimido"/"comprimidos").
 *
 * `posology`: texto de posologia para o documento.
 */
const INDICATION_ORDER = [
  "Dor intensa",
  "Ansiedade e agitação",
  "Crise convulsiva",
  "Emergência hipertensiva",
  "Hemorragia digestiva alta",
  "Sangramentos",
  "Hipocalemia",
  "Bradiarritmias",
  "Taquiarritmias",
  "IAMCSST",
  "Choque",
  "Sedação contínua",
  "Sequência rápida de intubação",
  "Trabalho de parto",
  "Variável",
];

const MEDICATIONS = [
  // --- Dor intensa ---
  {
    id: "cetoprofeno-ev-bolsa",
    label: "Cetoprofeno",
    name: "Cetoprofeno (1 mg/mL)",
    drugClass: "AINE",
    order: 1,
    route: "EV",
    unitSingular: "bolsa",
    unitPlural: "bolsas",
    posology: "Bolsa de 100mL",
    indication: "Dor intensa",
  },
  {
    id: "tenoxicam-ev",
    label: "Tenoxicam",
    name: "Tenoxicam (20 mg/2 mL)",
    drugClass: "AINE",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Dor intensa",
  },
  {
    id: "tramadol-ev-100mg",
    label: "Tramadol",
    name: "Tramadol (100 mg/2 mL)",
    drugClass: "Opioide",
    order: 3,
    route: "EV/IM",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Dor intensa",
  },
  {
    id: "morfina-ev",
    label: "Morfina",
    name: "Morfina (10 mg/mL)",
    drugClass: "Opioide",
    order: 4,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 1 mL",
    indication: "Dor intensa",
  },

  // --- Ansiedade e agitação ---
  {
    id: "diazepam-vo-5mg",
    label: "Diazepam",
    name: "Diazepam (5 mg/cp)",
    drugClass: "Benzodiazepínico",
    order: 1,
    route: "VO",
    unitSingular: "comprimido",
    unitPlural: "comprimidos",
    posology: "Comprimido de 5 mg",
    indication: "Ansiedade e agitação",
  },
  {
    id: "diazepam-vo-10mg",
    label: "Diazepam",
    name: "Diazepam (10 mg/cp)",
    drugClass: "Benzodiazepínico",
    order: 2,
    route: "VO",
    unitSingular: "comprimido",
    unitPlural: "comprimidos",
    posology: "Comprimido de 10 mg",
    indication: "Ansiedade e agitação",
  },
  {
    id: "diazepam-ev-10mg-2ml",
    label: "Diazepam",
    name: "Diazepam (10 mg/2 mL)",
    drugClass: "Benzodiazepínico",
    order: 4,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Ansiedade e agitação",
  },
  {
    id: "prometazina-im",
    label: "Prometazina (FENERGAN®)",
    name: "Prometazina (50 mg/2 mL)",
    drugClass: "Anti-histamínico",
    order: 5,
    route: "IM",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Ansiedade e agitação",
  },
  {
    id: "haloperidol-im",
    label: "Haloperidol",
    name: "Haloperidol (10 mg/2 mL)",
    drugClass: "Antipsicótico",
    order: 6,
    route: "IM",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Ansiedade e agitação",
  },

  // --- Crise convulsiva ---
  {
    id: "fenitoina-ev",
    label: "Fenitoína",
    name: "Fenitoína (250 mg/5 mL)",
    drugClass: "Anticonvulsivante",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 5 mL",
    indication: "Crise convulsiva",
  },
  {
    id: "fenobarbital-ev",
    label: "Fenobarbital",
    name: "Fenobarbital (200 mg/2 mL)",
    drugClass: "Barbitúrico",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Crise convulsiva",
  },

  // --- Emergência hipertensiva ---
  {
    id: "nitroglicerina-tridil-ev",
    label: "Nitroglicerina (TRIDIL®)",
    name: "Nitroglicerina - Tridil (50 mg/10 mL)",
    drugClass: "Nitrato / Vasodilatador",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Emergência hipertensiva",
  },
  {
    id: "nitroprussiato-sodio-nitrop-ev",
    label: "Nitroprussiato de sódio (NITROP®)",
    name: "Nitroprussiato de sódio - Nitrop (50 mg/2 mL)",
    drugClass: "Vasodilatador",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Emergência hipertensiva",
  },

  // --- Hemorragia digestiva alta ---
  {
    id: "omeprazol-ev",
    label: "Omeprazol",
    name: "Omeprazol (40 mg/ampola)",
    drugClass: "IBP",
    order: 1,
    route: "EV",
    unitSingular: "frasco-ampola",
    unitPlural: "frascos-ampola",
    posology: "Frasco-ampola",
    indication: "Hemorragia digestiva alta",
  },

  // --- Sangramentos ---
  {
    id: "acido-tranexamico-ev",
    label: "Ácido tranexâmico",
    name: "Ácido tranexâmico (250 mg/5 mL)",
    drugClass: "Antifibrinolítico",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 5 mL",
    indication: "Sangramentos",
  },

  // --- Hipocalemia ---
  {
    id: "cloreto-potassio-10-ev",
    label: "Cloreto de potássio 10%",
    name: "Cloreto de potássio (10%) - 10 mL",
    drugClass: "Eletrólito",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Hipocalemia",
  },

  // --- Bradiarritmias ---
  {
    id: "atropina-ev",
    label: "Atropina",
    name: "Atropina (0,5 mg/mL)",
    drugClass: "Anticolinérgico",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Bradiarritmias",
  },
  {
    id: "dopamina-ev",
    label: "Dopamina",
    name: "Dopamina (50 mg/10 mL)",
    drugClass: "Catecolamina",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Bradiarritmias",
  },

  // --- Taquiarritmias ---
  {
    id: "adenosina-ev",
    label: "Adenosina",
    name: "Adenosina (6 mg/2 mL)",
    drugClass: "Antiarrítmico",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Taquiarritmias",
  },
  {
    id: "amiodarona-ev",
    label: "Amiodarona",
    name: "Amiodarona (150 mg/3 mL)",
    drugClass: "Antiarrítmico",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 3 mL",
    indication: "Taquiarritmias",
  },
  {
    id: "deslanosideo-ev",
    label: "Deslanosídeo",
    name: "Deslanosídeo (0,4 mg/2 mL)",
    drugClass: "Glicosídeo cardíaco",
    order: 3,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 2 mL",
    indication: "Taquiarritmias",
  },

  // --- IAMCSST ---
  {
    id: "alteplase-ev",
    label: "Alteplase",
    name: "Alteplase (50 mg/50 mL)",
    drugClass: "Trombolítico",
    order: 1,
    route: "EV",
    unitSingular: "frasco",
    unitPlural: "frascos",
    posology: "Ampola de 50 mL",
    indication: "IAMCSST",
  },

  // --- Choque ---
  {
    id: "dobutamina-ev",
    label: "Dobutamina",
    name: "Dobutamina (250 mg/20 mL)",
    drugClass: "Inotrópico",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 20 mL",
    indication: "Choque",
  },
  {
    id: "noradrenalina-ev",
    label: "Noradrenalina",
    name: "Noradrenalina (8 mg/4 mL)",
    drugClass: "Catecolamina / Vasopressor",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 4 mL",
    indication: "Choque",
  },
  {
    id: "vasopressina-ev",
    label: "Vasopressina",
    name: "Vasopressina (20 UI/mL)",
    drugClass: "Vasopressor",
    order: 3,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 20 mL",
    indication: "Choque",
  },

  // --- Sedação contínua ---
  {
    id: "fentanil-ev-sedacao",
    label: "Fentanil",
    name: "Fentanil (0,50 mg/10 mL)",
    drugClass: "Opioide",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sedação contínua",
  },
  {
    id: "midazolam-ev-sedacao",
    label: "Midazolam",
    name: "Midazolam (50 mg/10 mL)",
    drugClass: "Benzodiazepínico",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sedação contínua",
  },

  // --- Sequência rápida de intubação ---
  {
    id: "escetamina-quetamina-ev",
    label: "Escetamina / Quetamina",
    name: "Escetamina / Quetamina (500 mg/10 mL)",
    drugClass: "Anestésico dissociativo",
    order: 1,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sequência rápida de intubação",
  },
  {
    id: "etomidato-ev",
    label: "Etomidato",
    name: "Etomidato (20 mg/10 mL)",
    drugClass: "Anestésico",
    order: 2,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sequência rápida de intubação",
  },
  {
    id: "fentanil-ev-sri",
    label: "Fentanil",
    name: "Fentanil (0,25 mg/5 mL)",
    drugClass: "Opioide",
    order: 3,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 5 mL",
    indication: "Sequência rápida de intubação",
  },
  {
    id: "rocuronio-ev",
    label: "Rocurônio",
    name: "Rocurônio (50 mg/10 mL)",
    drugClass: "Bloqueador neuromuscular",
    order: 4,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sequência rápida de intubação",
  },
  {
    id: "succinilcolina-ev",
    label: "Succinilcolina",
    name: "Succinilcolina (100 mg/10 mL)",
    drugClass: "Bloqueador neuromuscular",
    order: 5,
    route: "EV",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Sequência rápida de intubação",
  },

  // --- Trabalho de parto ---
  {
    id: "ocitocina-im",
    label: "Ocitocina",
    name: "Ocitocina (5 UI/mL)",
    drugClass: "Uterotônico",
    order: 1,
    route: "IM",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 10 mL",
    indication: "Trabalho de parto",
  },

  // --- Variável ---
  {
    id: "adrenalina-ev-im-vi",
    label: "Adrenalina / Epinefrina",
    name: "Adrenalina / Epinefrina (1 mg/mL)",
    drugClass: "Catecolamina",
    order: 1,
    route: "EV/IM/VI",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 1 mL",
    indication: "Variável",
  },
  {
    id: "midazolam-15mg-3ml",
    label: "Midazolam",
    name: "Midazolam (15 mg/3 mL)",
    drugClass: "Benzodiazepínico",
    order: 2,
    route: "EV/IM",
    unitSingular: "ampola",
    unitPlural: "ampolas",
    posology: "Ampola de 3 mL",
    indication: "Variável",
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

    if (!item.unitSingular || typeof item.unitSingular !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): unitSingular obrigatório.`);
    }

    if (!item.unitPlural || typeof item.unitPlural !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): unitPlural obrigatório.`);
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
