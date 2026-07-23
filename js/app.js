"use strict";

const state = {
  patientName: "",
  selectedMedicationId: null,
  downloadInFlight: false,
  lastDownloadedSignature: null
};

let statusTimeoutId = null;

function normalizePatientName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function isPatientNameValid() {
  return normalizePatientName(state.patientName).length >= 2;
}

function getMedicationById(id) {
  return MEDICATIONS.find((item) => item.id === id) || null;
}

function clearMedicationSelection() {
  state.selectedMedicationId = null;
}

function getCatalogMedicationFields(item) {
  return {
    name: String(item.name || "").trim(),
    drugClass: String(item.drugClass || "").trim(),
    route: String(item.route || "").trim(),
    posology: String(item.posology || "").trim(),
    dilution: String(item.dilution || "").trim()
  };
}

function resolveMedicationSelection() {
  const patientName = normalizePatientName(state.patientName);
  const missing = [];

  if (!isPatientNameValid()) {
    missing.push("patientName");
  }

  if (!state.selectedMedicationId) {
    missing.push("medication");
  }

  const item = getMedicationById(state.selectedMedicationId);

  if (!item || typeof MEDICATIONS === "undefined") {
    return {
      valid: false,
      missing: missing.length > 0 ? missing : ["medication"]
    };
  }

  if (!item.name || String(item.name).trim() === "") {
    missing.push("name");
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      medicationId: item.id,
      patientName
    };
  }

  const resolvedMedication = getCatalogMedicationFields(item);

  if (
    !resolvedMedication ||
    typeof resolvedMedication.name !== "string" ||
    resolvedMedication.name.trim() === ""
  ) {
    return {
      valid: false,
      missing: ["name"],
      medicationId: item.id,
      patientName
    };
  }

  return {
    valid: true,
    patientName,
    medicationId: item.id,
    label: item.label,
    medications: [resolvedMedication],
    indication: item.indication || ""
  };
}

function buildRequestSignature(resolved) {
  if (!resolved || resolved.valid !== true || !resolved.medicationId) {
    return null;
  }

  return [
    normalizePatientName(resolved.patientName).toLowerCase(),
    resolved.medicationId
  ].join("|");
}

function getResolvedMedicationTitle(resolved) {
  if (!resolved || !Array.isArray(resolved.medications)) {
    return "medicamento";
  }

  return resolved.medications.map((medication) => medication.name).join(" + ");
}

function formatDateBR(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function formatTimeBR(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildMedicationDocumentModel(resolved, issuedAt) {
  if (typeof validateAppConfig === "function" && !validateAppConfig()) {
    throw new Error("Configuração institucional inválida.");
  }

  if (!resolved || typeof resolved !== "object") {
    throw new Error("Solicitação ausente para montagem do modelo.");
  }

  if (resolved.valid !== true) {
    throw new Error("Solicitação inválida para montagem do modelo.");
  }

  if (!(issuedAt instanceof Date) || Number.isNaN(issuedAt.getTime())) {
    throw new Error("Data de emissão inválida.");
  }

  const patientName = String(resolved.patientName || "").trim();

  if (patientName.length < 2) {
    throw new Error("Nome do paciente inválido no modelo.");
  }

  const medications = Array.isArray(resolved.medications)
    ? resolved.medications.map((medication) => ({
        name: String(medication.name || "").trim(),
        drugClass: String(medication.drugClass || "").trim(),
        route: String(medication.route || "").trim(),
        posology: String(medication.posology || "").trim(),
        dilution: String(medication.dilution || "").trim()
      }))
    : [];

  if (
    medications.length === 0 ||
    medications.some((medication) => !medication.name)
  ) {
    throw new Error("Medicamentos inválidos no modelo.");
  }

  return {
    unit: {
      type: UNIT.type,
      name: UNIT.name,
      city: UNIT.city,
      address: String(UNIT.address || "").trim(),
      phone: String(UNIT.phone || "").trim(),
      logo: UNIT.logo,
      footer: UNIT.footer
    },
    patientName,
    medications,
    indication: String(resolved.indication || "").trim(),
    date: formatDateBR(issuedAt),
    time: formatTimeBR(issuedAt)
  };
}

function showAppStatus(message, variant, durationMs) {
  const status = document.getElementById("appStatus");

  if (!status) {
    return;
  }

  if (statusTimeoutId) {
    window.clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }

  status.hidden = false;
  status.classList.remove("is-success", "is-error", "is-progress");

  if (variant) {
    status.classList.add(`is-${variant}`);
  }

  status.textContent = message;

  if (variant === "progress") {
    return;
  }

  const timeout = Number.isFinite(durationMs) ? durationMs : 2800;

  statusTimeoutId = window.setTimeout(() => {
    status.hidden = true;
    status.textContent = "";
    status.classList.remove("is-success", "is-error", "is-progress");
    statusTimeoutId = null;
  }, timeout);
}

function clearPatientNameError() {
  const input = document.getElementById("patient-name");

  if (input) {
    input.classList.remove("is-invalid");
  }
}

function showPatientNameRequired() {
  const input = document.getElementById("patient-name");

  if (input) {
    input.classList.add("is-invalid");
    input.focus();
  }

  showAppStatus("Digite o nome do paciente.", "error", 2000);
}

function setGeneratingUi(isGenerating) {
  document.body.classList.toggle("is-generating", isGenerating);

  if (isGenerating) {
    showAppStatus("Gerando…", "progress");
  }
}

function resetMedicationSelectionAfterDownload() {
  clearMedicationSelection();
  state.lastDownloadedSignature = null;
}

async function tryFinalizeMedicationRequest() {
  if (state.downloadInFlight) {
    return false;
  }

  const resolved = resolveMedicationSelection();

  if (!resolved.valid) {
    return false;
  }

  const signature = buildRequestSignature(resolved);

  if (signature && signature === state.lastDownloadedSignature) {
    return false;
  }

  if (typeof downloadMedicationPdf !== "function") {
    console.error("[pdf] downloadMedicationPdf indisponível.");
    showAppStatus("Não foi possível gerar a folha. Tente novamente.", "error");
    return false;
  }

  if (typeof validateAppConfig === "function" && !validateAppConfig()) {
    console.error("[config] Configuração institucional inválida.");
    showAppStatus("Não foi possível gerar a folha. Tente novamente.", "error");
    return false;
  }

  state.downloadInFlight = true;
  state.lastDownloadedSignature = signature;
  setGeneratingUi(true);
  syncMedicationUI();

  try {
    const issuedAt = new Date();
    const documentModel = buildMedicationDocumentModel(resolved, issuedAt);
    await downloadMedicationPdf(documentModel);

    const medicationTitle = getResolvedMedicationTitle(resolved);
    const patientName = resolved.patientName;

    resetMedicationSelectionAfterDownload();
    syncMedicationUI();
    showAppStatus(
      `✓ Folha de ${medicationTitle} gerada para ${patientName}`,
      "success"
    );
    return true;
  } catch (error) {
    console.error("[pdf] Falha ao gerar a folha.", error);
    state.lastDownloadedSignature = null;
    showAppStatus("Não foi possível gerar a folha. Tente novamente.", "error");
    syncMedicationUI();
    return false;
  } finally {
    state.downloadInFlight = false;
    setGeneratingUi(false);
    syncMedicationUI();
  }
}

function createMedicationCard(item) {
  const isSelected = state.selectedMedicationId === item.id;
  const interactive = !state.downloadInFlight;
  const name = String(item.label || item.name || "").trim();
  const route = String(item.route || "").trim();
  const indication = String(item.indication || "").trim();

  const card = document.createElement("article");
  card.className = "medication-card";
  card.dataset.medicationId = item.id;

  if (isSelected) {
    card.classList.add("is-selected");
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "medication-card__trigger";
  trigger.setAttribute("aria-pressed", isSelected ? "true" : "false");
  trigger.disabled = !interactive;

  const titleEl = document.createElement("span");
  titleEl.className = "medication-card__title";
  titleEl.textContent = name;
  trigger.appendChild(titleEl);

  if (route) {
    const routeEl = document.createElement("span");
    routeEl.className = "medication-card__route";
    routeEl.textContent = route;
    trigger.appendChild(routeEl);
  }

  if (indication) {
    const indicationEl = document.createElement("span");
    indicationEl.className = "medication-card__indication";
    indicationEl.textContent = indication;
    trigger.appendChild(indicationEl);
  }

  trigger.addEventListener("click", () => {
    if (state.downloadInFlight) {
      return;
    }

    if (!isPatientNameValid()) {
      showPatientNameRequired();
      return;
    }

    clearPatientNameError();
    selectMedication(item.id);
  });

  card.appendChild(trigger);
  return card;
}

function selectMedication(medicationId) {
  if (state.downloadInFlight) {
    return;
  }

  state.selectedMedicationId = medicationId;
  syncMedicationUI();

  if (!getMedicationById(medicationId)) {
    return;
  }

  tryFinalizeMedicationRequest();
}

function drugClassSortIndex(drugClass) {
  const order =
    typeof DRUG_CLASS_ORDER !== "undefined" && Array.isArray(DRUG_CLASS_ORDER)
      ? DRUG_CLASS_ORDER
      : [];
  const index = order.indexOf(drugClass);
  return index === -1 ? order.length : index;
}

function groupMedicationsByDrugClass(items) {
  const groups = [];
  const indexByClass = new Map();

  items.forEach((item) => {
    const drugClass = String(item.drugClass || "").trim() || "Outros";
    let group = indexByClass.get(drugClass);

    if (!group) {
      group = { drugClass, items: [] };
      indexByClass.set(drugClass, group);
      groups.push(group);
    }

    group.items.push(item);
  });

  groups.sort((a, b) => {
    const byOrder =
      drugClassSortIndex(a.drugClass) - drugClassSortIndex(b.drugClass);
    if (byOrder !== 0) {
      return byOrder;
    }
    return a.drugClass.localeCompare(b.drugClass, "pt-BR");
  });

  groups.forEach((group) => {
    group.items.sort((a, b) => {
      const orderA = Number(a.order);
      const orderB = Number(b.order);
      const safeA = Number.isFinite(orderA) ? orderA : Number.POSITIVE_INFINITY;
      const safeB = Number.isFinite(orderB) ? orderB : Number.POSITIVE_INFINITY;
      if (safeA !== safeB) {
        return safeA - safeB;
      }
      return String(a.label || a.name || "").localeCompare(
        String(b.label || b.name || ""),
        "pt-BR"
      );
    });
  });

  return groups;
}

function renderMedicationCatalog() {
  const catalog = document.getElementById("medications-grid");

  if (!catalog || typeof MEDICATIONS === "undefined") {
    return;
  }

  catalog.innerHTML = "";

  groupMedicationsByDrugClass(MEDICATIONS).forEach((group, index) => {
    const section = document.createElement("section");
    section.className = "medication-group";
    section.setAttribute("aria-labelledby", `medication-group-${index}`);

    const heading = document.createElement("h2");
    heading.id = `medication-group-${index}`;
    heading.className = "section-title";
    heading.textContent = group.drugClass;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "medications-grid";

    group.items.forEach((item) => {
      grid.appendChild(createMedicationCard(item));
    });

    section.appendChild(grid);
    catalog.appendChild(section);
  });
}

function updateMedicationSectionState() {
  if (!isPatientNameValid()) {
    clearMedicationSelection();
    state.lastDownloadedSignature = null;
  }
}

function syncMedicationUI() {
  updateMedicationSectionState();
  renderMedicationCatalog();
}

function initPatientField() {
  const input = document.getElementById("patient-name");

  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    state.patientName = input.value;

    if (isPatientNameValid()) {
      clearPatientNameError();
    }

    syncMedicationUI();
  });

  input.addEventListener("blur", () => {
    const normalized = normalizePatientName(input.value);

    if (input.value === normalized && state.patientName === normalized) {
      return;
    }

    input.value = normalized;
    state.patientName = normalized;

    if (isPatientNameValid()) {
      clearPatientNameError();
    }

    syncMedicationUI();
  });
}

function initUnitHeader() {
  const subtitle = document.getElementById("app-unit-subtitle");

  if (!subtitle || typeof UNIT === "undefined") {
    return;
  }

  subtitle.textContent = `${UNIT.name} · ${UNIT.city}`;
}

function initApp() {
  initUnitHeader();
  initPatientField();
  syncMedicationUI();

  const patientInput = document.getElementById("patient-name");
  if (patientInput) {
    patientInput.focus();
  }
}

initApp();

console.log("Controle de Medicamentos: aplicação inicializada.");
