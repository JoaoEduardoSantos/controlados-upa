"use strict";

/**
 * Catálogo único de medicamentos disponíveis.
 * Scripts clássicos (sem ES Modules) para compatibilidade com file://.
 */
const MEDICATIONS = [
  {
    id: "adrenalina-inalatoria",
    label: "Adrenalina / Epinefrina — Via inalatória",
    shortLabel: "Adrenalina inalatória",
    type: "fixed",
    medications: [
      {
        name: "Adrenalina / Epinefrina",
        presentation: "1 mg/mL",
        route: "Inalatória",
        quantity: "5 ampolas",
        posology: "5 ampolas (1 mg/mL)"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "adrenalina-ev",
    label: "Adrenalina / Epinefrina — EV",
    shortLabel: "Adrenalina EV",
    type: "options",
    medications: [
      {
        name: "Adrenalina / Epinefrina",
        presentation: "1 mg/mL",
        route: "EV",
        quantity: "",
        posology: ""
      }
    ],
    options: [],
    optionGroups: [],
    indication: "",
    notes: "Quantidade de ampolas variável conforme necessidade clínica.",
    requiresQuantityInput: true
  },
  {
    id: "cetoprofeno-ev-bolsa",
    label: "Cetoprofeno — EV — Bolsa",
    shortLabel: "Cetoprofeno bolsa",
    type: "fixed",
    medications: [
      {
        name: "Cetoprofeno",
        presentation: "1 mg/mL",
        route: "EV",
        quantity: "1 bolsa",
        posology: "1 bolsa (1 mg/mL)"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "Dor",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "cetoprofeno-ev-100mgml",
    label: "Cetoprofeno — EV — 100 mg/mL",
    shortLabel: "Cetoprofeno 100 mg/mL",
    type: "fixed",
    medications: [
      {
        name: "Cetoprofeno",
        presentation: "100 mg/mL",
        route: "EV",
        quantity: "100 mg/mL",
        posology: "100 mg/mL"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "Dor",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "diazepam-ev",
    label: "Diazepam — EV",
    shortLabel: "Diazepam EV",
    type: "fixed",
    medications: [
      {
        name: "Diazepam",
        presentation: "10 mg/mL",
        route: "EV",
        quantity: "1 mL",
        posology: "1 mL (10 mg/mL) diluído e CPM"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "diazepam-vo",
    label: "Diazepam — VO",
    shortLabel: "Diazepam VO",
    type: "options",
    medications: [
      {
        name: "Diazepam",
        presentation: "",
        route: "VO",
        quantity: "",
        posology: ""
      }
    ],
    options: [
      {
        id: "5mg",
        label: "5 mg",
        overrides: {
          quantity: "5 mg",
          posology: "5 mg"
        }
      },
      {
        id: "10mg",
        label: "10 mg",
        overrides: {
          quantity: "10 mg",
          posology: "10 mg"
        }
      }
    ],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "morfina-ev",
    label: "Morfina — EV",
    shortLabel: "Morfina EV",
    type: "fixed",
    medications: [
      {
        name: "Morfina",
        presentation: "10 mg/mL",
        route: "EV",
        quantity: "1 mL",
        posology: "1 mL (10 mg/mL) diluído e CPM"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "omeprazol-ev",
    label: "Omeprazol — EV",
    shortLabel: "Omeprazol EV",
    type: "fixed",
    medications: [
      {
        name: "Omeprazol",
        presentation: "40 mg/ampola",
        route: "EV",
        quantity: "1 ampola + diluente próprio",
        posology: "40 mg/ampola + diluente próprio"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    // Documento-fonte utilizava a grafia "MIDAZOLAN"; no catálogo padronizamos para "Midazolam".
    id: "sedacao-midazolam-fentanil",
    label: "Sedação contínua — Midazolam + Fentanil",
    shortLabel: "Sedação Midazolam + Fentanil",
    type: "combined",
    medications: [
      {
        name: "Midazolam",
        presentation: "5 mg/mL",
        route: "EV",
        quantity: "4 ampolas",
        posology: "4 ampolas (5 mg/mL) = total 40 mL"
      },
      {
        name: "Fentanil",
        presentation: "0,0785 mg/mL",
        route: "EV",
        quantity: "4 ampolas",
        posology: "4 ampolas (0,0785 mg/mL) = total 40 mL"
      }
    ],
    options: [],
    optionGroups: [],
    indication: "Sedação contínua - paciente em VM",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "tramadol-ev",
    label: "Tramadol — EV",
    shortLabel: "Tramadol EV",
    type: "options",
    medications: [
      {
        name: "Tramadol",
        presentation: "",
        route: "EV",
        quantity: "",
        posology: ""
      }
    ],
    options: [
      {
        id: "50mg",
        label: "1 mL (50 mg)",
        overrides: {
          presentation: "50 mg",
          quantity: "1 mL",
          posology: "1 mL (50 mg)"
        }
      },
      {
        id: "100mg",
        label: "2 mL (100 mg)",
        overrides: {
          presentation: "100 mg",
          quantity: "2 mL",
          posology: "2 mL (100 mg)"
        }
      }
    ],
    optionGroups: [],
    indication: "",
    notes: "",
    requiresQuantityInput: false
  },
  {
    id: "tramadol-im-sc",
    label: "Tramadol — IM / SC",
    shortLabel: "Tramadol IM/SC",
    type: "options",
    medications: [
      {
        name: "Tramadol",
        presentation: "",
        route: "",
        quantity: "",
        posology: ""
      }
    ],
    options: [],
    optionGroups: [
      {
        id: "route",
        label: "Via",
        required: true,
        options: [
          {
            id: "im",
            label: "IM",
            overrides: {
              route: "IM"
            }
          },
          {
            id: "sc",
            label: "SC",
            overrides: {
              route: "SC"
            }
          }
        ]
      },
      {
        id: "dose",
        label: "Dose",
        required: true,
        options: [
          {
            id: "50mg",
            label: "1 mL (50 mg)",
            overrides: {
              presentation: "50 mg",
              quantity: "1 mL",
              posology: "1 mL (50 mg)"
            }
          },
          {
            id: "100mg",
            label: "2 mL (100 mg)",
            overrides: {
              presentation: "100 mg",
              quantity: "2 mL",
              posology: "2 mL (100 mg)"
            }
          }
        ]
      }
    ],
    indication: "Dor refratária",
    notes: "",
    requiresQuantityInput: false
  }
];

const SUPPORTED_MEDICATION_TYPES = ["fixed", "options", "combined"];

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

    if (!item.type || typeof item.type !== "string") {
      errors.push(`${prefix} (${item.id || "?"}): type obrigatório.`);
    } else if (!SUPPORTED_MEDICATION_TYPES.includes(item.type)) {
      errors.push(
        `${prefix} (${item.id || "?"}): type inválido "${item.type}".`
      );
    }

    if (!Array.isArray(item.medications) || item.medications.length === 0) {
      errors.push(
        `${prefix} (${item.id || "?"}): medications deve ser um array não vazio.`
      );
    } else {
      item.medications.forEach((med, medIndex) => {
        if (!med || typeof med !== "object" || !med.name) {
          errors.push(
            `${prefix} (${item.id || "?"}).medications[${medIndex}]: name obrigatório.`
          );
        }
      });
    }

    if (Array.isArray(item.optionGroups)) {
      item.optionGroups.forEach((group, groupIndex) => {
        if (!group || typeof group !== "object") {
          errors.push(
            `${prefix} (${item.id || "?"}).optionGroups[${groupIndex}]: grupo inválido.`
          );
          return;
        }

        if (
          group.required &&
          (!Array.isArray(group.options) || group.options.length === 0)
        ) {
          errors.push(
            `${prefix} (${item.id || "?"}).optionGroups[${groupIndex}] (${group.id || "?"}): grupo obrigatório sem opções.`
          );
        }
      });
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
