"use strict";

/**
 * Textos prontos para copiar na prescrição.
 * Cada grupo vira uma seção; cada item é uma linha com botão de copiar.
 * Dentro da seção a ordem é VO, IM, EV e, por último, as demais vias.
 */
const PRESCRIPTION_TEXTS = [
  {
    id: "analgesico",
    title: "Analgésico",
    items: [
      { id: "dipirona-vo", text: "DIPIRONA (500 mg/cp) - 1 CP - VO" },
      { id: "paracetamol", text: "PARACETAMOL (500 mg/cp) - 1 CP – VO" },
      { id: "dipirona-im", text: "DIPIRONA (500 mg/mL) - 2 mL - IM" },
      { id: "dipirona-ev", text: "DIPIRONA (500 mg/mL): 2 mL + 8 mL ABD - EV" },
      { id: "tramadol", text: "TRAMADOL (50 mg/mL): 2 mL + 100 mL SF 0,9% - EV – se dor refratária" },
      { id: "morfina", text: "MORFINA (10 mg/mL): 1 mL + 9 mL ABD – EV: fazer 3 mL – se dor refratária ao tramadol" }
    ]
  },
  {
    id: "aine",
    title: "AINE",
    items: [
      { id: "diclofenaco", text: "DICLOFENACO (75 mg/3 mL): 3 mL - IM" },
      { id: "cetoprofeno-im", text: "CETOPROFENO (100 mg/2 mL): 2 mL – IM" },
      { id: "cetoprofeno-ev", text: "CETOPROFENO (100 mg/2 mL): 2 mL + 100 mL SF 0,9% - EV" }
    ]
  },
  {
    id: "antiespasmodico",
    title: "Antiespasmódico",
    items: [
      { id: "buscopan-simples", text: "BUSCOPAN SIMPLES (20 mg/mL): 1 mL + 19 mL SF 0,9% – EV" },
      { id: "buscopan-composto", text: "BUSCOPAN COMPOSTO: 5 mL + 100 mL SF 0,9% - EV" }
    ]
  },
  {
    id: "antiemetico",
    title: "Antiemético",
    items: [
      { id: "metoclopramida-vo", text: "METOCLOPRAMIDA (10 mg/cp) - 1 CP - VO" },
      { id: "ondansetrona-vo", text: "ONDANSETRONA (2 mg/cp) - 1 CP – VO" },
      { id: "metoclopramida-ev", text: "METOCLOPRAMIDA (5 mg/mL): 2 mL + 8 mL ABD – EV" },
      { id: "ondansetrona-ev", text: "ONDANSETRONA (2 mg/mL): 2 mL + 18 mL ABD - EV" },
      { id: "bromoprida", text: "BROMOPRIDA (5 mg/mL): 2 mL + 8 mL ABD - EV" }
    ]
  },
  {
    id: "anti-histaminico",
    title: "Antihistamínico",
    items: [
      { id: "dexclorfeniramina", text: "DEXCLORFENIRAMINA (2 mg/cp) - 1 CP - VO" },
      { id: "loratadina", text: "LORATADINA (10 mg/cp) - 1 CP – VO" },
      { id: "prometazina", text: "PROMETAZINA (25 mg/mL): 2 mL - IM" }
    ]
  },
  {
    id: "corticoide",
    title: "Corticoide",
    items: [
      { id: "dexametasona-im", text: "DEXAMETASONA (4 mg/mL): 2,5 mL - IM" },
      { id: "hidrocortisona-100", text: "HIDROCORTISONA (100 mg/AMP): 1 AMP em 20 mL ABD – EV" },
      { id: "hidrocortisona-500", text: "HIDROCORTISONA (500 mg/AMP): 1 AMP em 20 mL ABD - EV" },
      { id: "dexametasona-ev", text: "DEXAMETASONA (4 mg/mL): 2,5 mL + 100 mL SF 0,9% - EV" }
    ]
  },
  {
    id: "broncodilatadores",
    title: "Broncodilatadores",
    items: [
      { id: "salbutamol", text: "SALBUTAMOL (100 mcg/dose): 10 JATOS - VI: ATAQUE: 20 em 20 minutos por 1 HORA (3 ciclos)" },
      { id: "ipratropio", text: "IPRATRÓPIO (0,25 mg/mL): 40 gotas em 3 mL de SF 0,9% - NBZ: 2 em 2 horas, após salbutamol" }
    ]
  },
  {
    id: "antibiotico",
    title: "Antibiótico",
    items: [
      { id: "azitromicina", text: "AZITROMICINA (500 mg/cp) – 1 CP – VO – 24/24 h – D1" },
      { id: "clavulin-diluido", text: "CLAVULIN – 1G em 20 mL ABD – EV – 8/8 horas – D0" },
      { id: "ceftriaxona", text: "CEFTRIAXONA – 1G em 20 mL ABD – EV – 12/12 h – D0" },
      { id: "oxacilina", text: "OXACILINA (500 mg/AMP): 2 AMP em 100 mL SF 0,9% – EV – 4/4h – D0" },
      { id: "metronidazol", text: "METRONIDAZOL (5 mg/mL) – 100 mL – EV – 8/8 horas – D0" },
      { id: "levofloxacino", text: "LEVOFLOXACINO – 750 mg – EV – 24/24 horas – D0" },
      { id: "meropenem", text: "MEROPENEM – 1G – EV – 8/8 horas – D0" }
    ]
  },
  {
    id: "antihipertensivo",
    title: "Antihipertensivo",
    items: [
      { id: "hidralazina", text: "HIDRALAZINA (50 mg/cp) - 1 CP - VO" },
      { id: "clonidina", text: "CLONIDINA (0,150 mg/cp) - 1 CP - VO" },
      { id: "captopril", text: "CAPTOPRIL (25 mg/cp) - 1 CP - VO" },
      { id: "anlodipino-5", text: "ANLODIPINO (5 mg/cp) - 1 CP - VO" },
      { id: "anlodipino-10", text: "ANLODIPINO (10 mg/cp) - 1 CP - VO" },
      { id: "nifedipino-10", text: "NIFEDIPINO (10 mg/cp) - 1 CP - VO" },
      { id: "nifedipino-20", text: "NIFEDIPINO (20 mg/cp) - 1 CP - VO" },
      { id: "atenolol-25", text: "ATENOLOL (25 mg/cp) - 1 CP - VO" },
      { id: "atenolol-50", text: "ATENOLOL (50 mg/cp) - 1 CP - VO" },
      { id: "propranolol-20", text: "PROPRANOLOL (20 mg/cp) - 1 CP - VO" },
      { id: "propranolol-40", text: "PROPRANOLOL (40 mg/cp) - 1 CP - VO" },
      { id: "metoprolol", text: "METOPROLOL (25 mg/cp) - 1 CP - VO" },
      { id: "carvedilol-3125", text: "CARVEDILOL (3,125 mg/cp) - 1 CP - VO" },
      { id: "carvedilol-125", text: "CARVEDILOL (12,5 mg/cp) - 1 CP – VO" },
      { id: "furosemida", text: "FUROSEMIDA (20 mg/AMP): X AMP – EV" }
    ]
  },
  {
    id: "antivertiginoso",
    title: "Antivertiginoso",
    items: [
      { id: "cinarizina", text: "CINARIZINA (75 mg/cp) - 1 CP – VO" }
    ]
  },
  {
    id: "ansiedade-agitacao",
    title: "Ansiedade e agitação",
    items: [
      { id: "diazepam-5", text: "DIAZEPAM (5 mg/cp) - 1 CP - VO" },
      { id: "diazepam-10-vo", text: "DIAZEPAM (10 mg/cp) - 1 CP – VO" },
      { id: "prometazina", text: "PROMETAZINA (25 mg/mL): 2 mL - IM" },
      { id: "midazolam", text: "MIDAZOLAM (5 mg/mL): 3 mL - IM" },
      { id: "haloperidol", text: "HALOPERIDOL (5 mg/mL): 2 mL - IM" },
      { id: "diazepam-ev", text: "DIAZEPAM (10 mg/2 mL): 2 mL + 8 mL ABD - EV lento (em 2 minutos)" }
    ]
  },
  {
    id: "anticonvulsionante",
    title: "Anticonvulsionante",
    items: [
      { id: "diazepam", text: "DIAZEPAM (5 mg/mL) – 2 mL + 8 mL ABD – EV – ACM" },
      { id: "fenitoina", text: "FENITOÍNA (50 mg/mL): 4 AMP + 250 mL SF 0,9% – EV BIC – ACM" }
    ]
  },
  {
    id: "vitamina",
    title: "Vitamina",
    items: [
      { id: "complexo-b", text: "COMPLEXO B: 1 AMP + 500 mL SF 0,9% - EV" },
      { id: "tiamina", text: "TIAMINA (100 mg/AMP): 3 AMP + 500 mL SF 0,9% - EV" }
    ]
  },
  {
    id: "antifibrinolitico",
    title: "Antifibrinolítico",
    items: [
      { id: "acido-tranexamico", text: "ÁC. TRANEXÂMICO (50 mg/mL): 4 AMP + 100 mL SF 0,9% - EV LIVRE" }
    ]
  },
  {
    id: "anti-hemorragico",
    title: "Antihemorrágico",
    items: [
      { id: "vitamina-k", text: "VITAMINA K (10 mg/mL): 1 mL - IM" }
    ]
  },
  {
    id: "hiponatremia",
    title: "Hiponatremia",
    items: [
      { id: "nacl-bolus", text: "NaCl (10%): 50 mL + 500 mL – EV BIC – 174 mL em 10 min – ACM" },
      { id: "nacl-bic", text: "NaCl (10%): 50 mL + 500 mL – EV BIC: 26 a 52 mL/h" }
    ]
  },
  {
    id: "hipercalemia",
    title: "Hipercalemia",
    items: [
      { id: "gluc-calcio", text: "GLUC. CÁLCIO (10%) 20 mL + 100 mL SF 0,9% - EV – ACM" },
      { id: "insulina-regular", text: "INSULINA REGULAR (100 UI/mL): 10 unidades + 500 mL SG 5% + SG 50% 60 mL – EV BIC em 60 minutos – ACM" }
    ]
  },
  {
    id: "anticoagulante",
    title: "Anticoagulante",
    items: [
      { id: "enoxaparina", text: "ENOXAPARINA (40 mg/AMP) – 1 AMP – SC – 24/24 horas" }
    ]
  },
  {
    id: "sri",
    title: "Sequência rápida de intubação (SRI)",
    items: [
      { id: "fentanil", text: "FENTANIL (50 mcg/mL): X mL - EV bolus em 30 segundos" },
      { id: "etomidato", text: "ETOMIDATO (2 mg/mL): X mL - EV bolus em 60 segundo" },
      { id: "cetamina", text: "CETAMINA (50 mg/mL): X mL - EV bolus em 60 segundos" },
      { id: "midazolam", text: "MIDAZOLAM (5 mg/mL): X mL - EV bolus em 60 segundos" },
      { id: "succinilcolina", text: "SUCCINILCOLINA (100 mg/AMP): Diluir 1 AMP em 10 mL ABD - X mL - EV bolus em 60 segundos" },
      { id: "rocuronio", text: "ROCURÔNIO (10 mg/mL): X mL - EV bolus em 90 segundos" }
    ]
  },
  {
    id: "sedacao-continua",
    title: "Sedação contínua",
    items: [
      { id: "fenitanil", text: "FENITANIL (50 mcg/mL): 40 mL + 160 mL SF 0,9% - EV BIC - ACM" },
      { id: "midazolam", text: "MIDAZOLAM (5 mg/mL): 40 mL + 160 mL SF 0,9% - EV BIC - ACM" },
      { id: "fentanil-midazolam", text: "[FENTANIL (50 mcg/mL) 40 mL + MIDAZOLAM (5 mg/mL) 40 mL + 120 mL SF 0,9%] EV BIC - X mL/h" }
    ]
  },
  {
    id: "drogas-emergencia",
    title: "Drogas emergência",
    items: [
      { id: "tridil", text: "TRIDIL (5 mg/mL): 10 mL + 240 mL SF 0,9% - EV BIC - iniciar a 10 mL/h" },
      { id: "nitrop", text: "NITROP (50 mg/mL): 2 mL + 248 mL SG 5% - EV BIC - iniciar a 5 mL/h" },
      { id: "noradrenalina", text: "NORADRENALINA (2 mg/mL): 16 mL + 184 mL SG 5% - EV BIC - ACM" },
      { id: "dobutamina", text: "DOBUTAMINA (12,5 mg/mL): 20 mL + 230 mL SF 0,9% - EV BIC - ACM" },
      { id: "dopamina", text: "DOPAMINA (5 mg/mL): 50 mL + 200 mL SF 0,9% - EV BIC - ACM" },
      { id: "noradrenalina-bic", text: "NORADRENALINA (2 mg/mL): 16 mL + 184 mL SG 5% – EV – BIC – ACM" },
      { id: "dobutamina-bic", text: "DOBUTAMINA (12,5 mg/mL): 20 mL + SF 0,9% 230 mL – EV – BIC – ACM" },
      { id: "fentanil", text: "FENTANIL (0,0785 mg/mL): 40 mL + SF 0,9% 160 mL – EV – BIC – ACM" },
      { id: "midazolan", text: "MIDAZOLAN (5 mg/mL): 40 mL + SF0,9% 160 mL – EV – BIC – ACM" }
    ]
  }
];

function validatePrescriptionCatalog() {
  const errors = [];

  if (!Array.isArray(PRESCRIPTION_TEXTS)) {
    console.error("[prescriptions] PRESCRIPTION_TEXTS deve ser um array.");
    return false;
  }

  const seenGroupIds = new Set();

  PRESCRIPTION_TEXTS.forEach((group, index) => {
    const prefix = `[prescriptions] group[${index}]`;

    if (!group || typeof group !== "object") {
      errors.push(`${prefix}: grupo inválido.`);
      return;
    }

    if (!group.id || typeof group.id !== "string") {
      errors.push(`${prefix}: id obrigatório.`);
    } else if (seenGroupIds.has(group.id)) {
      errors.push(`${prefix}: id duplicado "${group.id}".`);
    } else {
      seenGroupIds.add(group.id);
    }

    if (!group.title || typeof group.title !== "string") {
      errors.push(`${prefix} (${group.id || "?"}): title obrigatório.`);
    }

    if (!Array.isArray(group.items) || group.items.length === 0) {
      errors.push(`${prefix} (${group.id || "?"}): items deve ser um array não vazio.`);
      return;
    }

    const seenItemIds = new Set();

    group.items.forEach((item, itemIndex) => {
      if (!item || typeof item !== "object" || !item.id || !item.text) {
        errors.push(
          `${prefix} (${group.id || "?"}).items[${itemIndex}]: id e text obrigatórios.`
        );
        return;
      }

      if (seenItemIds.has(item.id)) {
        errors.push(
          `${prefix} (${group.id || "?"}): id de item duplicado "${item.id}".`
        );
      } else {
        seenItemIds.add(item.id);
      }
    });
  });

  if (errors.length > 0) {
    errors.forEach((message) => {
      console.error(message);
    });
    return false;
  }

  return true;
}

validatePrescriptionCatalog();
