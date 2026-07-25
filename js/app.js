"use strict";

const state = {
  patientName: "",
  selectedMedicationId: null,
  quantity: 1,
  quantityCustom: false,
  downloadInFlight: false,
  lastDownloadedSignature: null
};

const QUANTITY_SLIDER_MAX = 4;

let statusTimeoutId = null;

function normalizePatientName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function toPatientNameCase(value) {
  const normalized = normalizePatientName(value);
  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }
      const lower = word.toLocaleLowerCase("pt-BR");
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
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
    unitSingular: String(item.unitSingular || "").trim(),
    unitPlural: String(item.unitPlural || "").trim(),
    posology: String(item.posology || "").trim()
  };
}

function resolveMedicationSelection() {
  const patientName = toPatientNameCase(state.patientName);
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
    medications: [
      {
        ...resolvedMedication,
        quantity: getDispenseQuantity()
      }
    ],
    indication: item.indication || "",
    quantity: getDispenseQuantity()
  };
}

function buildRequestSignature(resolved) {
  if (!resolved || resolved.valid !== true || !resolved.medicationId) {
    return null;
  }

  return [
    normalizePatientName(resolved.patientName).toLowerCase(),
    resolved.medicationId,
    String(resolved.quantity || getDispenseQuantity())
  ].join("|");
}

function getResolvedMedicationTitle(resolved) {
  if (resolved && typeof resolved.label === "string" && resolved.label.trim()) {
    return resolved.label.trim();
  }

  if (!resolved || !Array.isArray(resolved.medications)) {
    return "medicamento";
  }

  return resolved.medications.map((medication) => medication.name).join(" + ");
}

function getPatientFirstName(fullName) {
  const cased = toPatientNameCase(fullName);
  if (!cased) {
    return "";
  }
  return cased.split(" ")[0];
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

  const patientName = toPatientNameCase(resolved.patientName);

  if (patientName.length < 2) {
    throw new Error("Nome do paciente inválido no modelo.");
  }

  const medications = Array.isArray(resolved.medications)
    ? resolved.medications.map((medication) => ({
        name: String(medication.name || "").trim(),
        drugClass: String(medication.drugClass || "").trim(),
        route: String(medication.route || "").trim(),
        unitSingular: String(medication.unitSingular || "").trim(),
        unitPlural: String(medication.unitPlural || "").trim(),
        posology: String(medication.posology || "").trim(),
        quantity: Number(medication.quantity) || getDispenseQuantity()
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
  resetQuantitySlider();
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
    const patientFirstName = getPatientFirstName(resolved.patientName);

    resetMedicationSelectionAfterDownload();
    syncMedicationUI();
    showAppStatus(
      `✓ Folha de ${medicationTitle} gerada para ${patientFirstName}`,
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
  const drugClass = String(item.drugClass || "").trim();
  const route = String(item.route || "").trim();
  const posology = String(item.posology || "").trim();

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

  if (drugClass) {
    const classEl = document.createElement("span");
    classEl.className = "medication-card__class";
    classEl.textContent = drugClass;
    trigger.appendChild(classEl);
  }

  const titleEl = document.createElement("span");
  titleEl.className = "medication-card__title";
  titleEl.textContent = name;
  trigger.appendChild(titleEl);

  const metaParts = [route, posology].filter(Boolean);
  if (metaParts.length > 0) {
    const metaEl = document.createElement("span");
    metaEl.className = "medication-card__route";
    metaEl.textContent = metaParts.join(" · ");
    trigger.appendChild(metaEl);
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

function indicationSortIndex(indication) {
  const order =
    typeof INDICATION_ORDER !== "undefined" && Array.isArray(INDICATION_ORDER)
      ? INDICATION_ORDER
      : [];
  const index = order.indexOf(indication);
  return index === -1 ? order.length : index;
}

function groupMedicationsByIndication(items) {
  const groups = [];
  const indexByIndication = new Map();

  items.forEach((item) => {
    const indication = String(item.indication || "").trim() || "Sem indicação";
    let group = indexByIndication.get(indication);

    if (!group) {
      group = { indication, items: [] };
      indexByIndication.set(indication, group);
      groups.push(group);
    }

    group.items.push(item);
  });

  groups.sort((a, b) => {
    const byOrder =
      indicationSortIndex(a.indication) - indicationSortIndex(b.indication);
    if (byOrder !== 0) {
      return byOrder;
    }
    return a.indication.localeCompare(b.indication, "pt-BR");
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

  groupMedicationsByIndication(MEDICATIONS).forEach((group, index) => {
    const section = document.createElement("section");
    section.className = "medication-group";
    section.setAttribute("aria-labelledby", `medication-group-${index}`);

    const heading = document.createElement("h2");
    heading.id = `medication-group-${index}`;
    heading.className = "section-title";
    heading.textContent = group.indication;
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

function getDispenseQuantity() {
  const quantity = Number(state.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }
  return Math.floor(quantity);
}

function quantityStopCount() {
  // Stops: 1, 2, 3, 4, custom (far right)
  return QUANTITY_SLIDER_MAX + 1;
}

function quantityStopIndexFromState() {
  if (state.quantityCustom || state.quantity > QUANTITY_SLIDER_MAX) {
    return QUANTITY_SLIDER_MAX;
  }
  return Math.max(0, Math.min(QUANTITY_SLIDER_MAX - 1, state.quantity - 1));
}

function quantityPercentForStop(stopIndex) {
  const maxStop = quantityStopCount() - 1;
  if (maxStop <= 0) {
    return 0;
  }
  return (stopIndex / maxStop) * 100;
}

function syncQuantitySliderUI() {
  const root = document.getElementById("quantity-slider");
  const thumb = document.getElementById("quantity-thumb");
  const fill = document.getElementById("quantity-fill");
  const knob = document.getElementById("quantity-knob");
  const valueEl = document.getElementById("quantity-value");
  const inputEl = document.getElementById("quantity-input");

  if (!root || !thumb || !fill || !knob || !valueEl || !inputEl) {
    return;
  }

  const quantity = getDispenseQuantity();
  const stopIndex = quantityStopIndexFromState();
  const percent = quantityPercentForStop(stopIndex);
  const isCustom = state.quantityCustom === true;

  root.classList.toggle("is-custom", isCustom);
  root.setAttribute("aria-valuenow", String(quantity));
  if (isCustom) {
    root.setAttribute("aria-valuetext", `${quantity} (personalizado)`);
  } else {
    root.setAttribute("aria-valuetext", String(quantity));
  }

  thumb.style.left = `${percent}%`;
  fill.style.width = `${percent}%`;
  knob.style.left = `${percent}%`;

  if (isCustom) {
    valueEl.hidden = true;
    inputEl.hidden = false;
    if (document.activeElement !== inputEl) {
      inputEl.value = String(quantity);
    }
  } else {
    inputEl.hidden = true;
    valueEl.hidden = false;
    valueEl.textContent = String(quantity);
  }
}

function setQuantityFromStop(stopIndex, options = {}) {
  const maxStop = quantityStopCount() - 1;
  const clamped = Math.max(0, Math.min(maxStop, stopIndex));

  if (clamped >= QUANTITY_SLIDER_MAX) {
    const keepValue =
      options.preserveCustomValue === true && getDispenseQuantity() > QUANTITY_SLIDER_MAX
        ? getDispenseQuantity()
        : state.quantityCustom
          ? getDispenseQuantity()
          : QUANTITY_SLIDER_MAX;
    state.quantityCustom = true;
    state.quantity = Math.max(QUANTITY_SLIDER_MAX, keepValue);
  } else {
    state.quantityCustom = false;
    state.quantity = clamped + 1;
  }

  syncQuantitySliderUI();

  if (state.quantityCustom && options.focusInput) {
    const inputEl = document.getElementById("quantity-input");
    if (inputEl) {
      inputEl.hidden = false;
      inputEl.focus();
      inputEl.select();
    }
  }
}

function setQuantityFromClientX(clientX, options = {}) {
  const track = document.getElementById("quantity-track");
  if (!track) {
    return;
  }

  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) {
    return;
  }

  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const maxStop = quantityStopCount() - 1;
  const stopIndex = Math.round(ratio * maxStop);
  setQuantityFromStop(stopIndex, options);
}

function resetQuantitySlider() {
  state.quantity = 1;
  state.quantityCustom = false;
  syncQuantitySliderUI();
}

function initQuantitySlider() {
  const root = document.getElementById("quantity-slider");
  const track = document.getElementById("quantity-track");
  const inputEl = document.getElementById("quantity-input");

  if (!root || !track || !inputEl) {
    return;
  }

  let dragging = false;
  let enteredCustomByDrag = false;

  const endDrag = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    root.classList.remove("is-dragging");

    if (enteredCustomByDrag && state.quantityCustom) {
      enteredCustomByDrag = false;
      const input = document.getElementById("quantity-input");
      if (input) {
        input.hidden = false;
        input.focus();
        input.select();
      }
    }
  };

  const onPointerMove = (event) => {
    if (!dragging) {
      return;
    }
    const wasCustom = state.quantityCustom;
    setQuantityFromClientX(event.clientX, { preserveCustomValue: true });
    if (!wasCustom && state.quantityCustom) {
      enteredCustomByDrag = true;
    }
  };

  root.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    if (event.target === inputEl) {
      return;
    }

    dragging = true;
    enteredCustomByDrag = false;
    root.classList.add("is-dragging");
    root.setPointerCapture?.(event.pointerId);
    setQuantityFromClientX(event.clientX);
    event.preventDefault();
  });

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);
  root.addEventListener("lostpointercapture", endDrag);

  root.addEventListener("keydown", (event) => {
    if (event.target === inputEl) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      if (state.quantityCustom) {
        setQuantityFromStop(QUANTITY_SLIDER_MAX - 1);
      } else {
        setQuantityFromStop(quantityStopIndexFromState() - 1);
      }
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setQuantityFromStop(quantityStopIndexFromState() + 1, {
        focusInput: true
      });
    } else if (event.key === "Home") {
      event.preventDefault();
      setQuantityFromStop(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setQuantityFromStop(QUANTITY_SLIDER_MAX, { focusInput: true });
    }
  });

  inputEl.addEventListener("input", () => {
    const digits = String(inputEl.value || "").replace(/\D/g, "");
    inputEl.value = digits;

    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return;
    }

    state.quantityCustom = true;
    state.quantity = parsed;
    syncQuantitySliderUI();
  });

  inputEl.addEventListener("blur", () => {
    let parsed = Number.parseInt(String(inputEl.value || ""), 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      parsed = QUANTITY_SLIDER_MAX;
    }

    if (parsed <= QUANTITY_SLIDER_MAX) {
      state.quantityCustom = false;
      state.quantity = parsed;
    } else {
      state.quantityCustom = true;
      state.quantity = parsed;
    }

    syncQuantitySliderUI();
  });

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputEl.blur();
    }
  });

  syncQuantitySliderUI();
}

function initApp() {
  initUnitHeader();
  initPatientField();
  initQuantitySlider();
  syncMedicationUI();

  const patientInput = document.getElementById("patient-name");
  if (patientInput) {
    patientInput.focus();
  }
}

initApp();

console.log("Controle de Medicamentos: aplicação inicializada.");
