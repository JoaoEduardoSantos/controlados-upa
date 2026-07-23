"use strict";

const state = {
  patientName: "",
  selectedMedicationId: null,
  selections: {},
  quantity: null,
  downloadInFlight: false,
  lastDownloadedSignature: null
};

const MSG_MEDICATIONS_DISABLED =
  "Digite o nome do paciente para liberar os medicamentos.";
const MSG_MEDICATIONS_ENABLED =
  "Selecione o medicamento que será retirado na farmácia.";

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
  state.selections = {};
  state.quantity = null;
}

function isPositiveIntegerQuantity(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const number = Number(value);
  return Number.isInteger(number) && number >= 1;
}

function parseQuantityInput(rawValue) {
  const raw = String(rawValue ?? "").trim();

  if (raw === "") {
    return null;
  }

  const number = Number(raw);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

function formatOptionPreviewLabel(label) {
  const match = String(label).match(/\(([^)]+)\)/);
  return match ? match[1] : label;
}

function getMedicationCardMeta(item) {
  if (item.type === "combined") {
    return item.medications.map((med) => med.name).join(" + ");
  }

  if (Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
    const routeGroup = item.optionGroups.find((group) => group.id === "route");
    const doseGroup = item.optionGroups.find((group) => group.id === "dose");
    const parts = [];

    if (routeGroup) {
      parts.push(routeGroup.options.map((option) => option.label).join(" / "));
    }

    if (doseGroup) {
      parts.push(
        doseGroup.options
          .map((option) => formatOptionPreviewLabel(option.label))
          .join(" ou ")
      );
    }

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  if (Array.isArray(item.options) && item.options.length > 0) {
    const route = item.medications.map((med) => med.route).find(Boolean) || "";
    const doses = item.options
      .map((option) => formatOptionPreviewLabel(option.label))
      .join(" ou ");
    return [route, doses].filter(Boolean).join(" · ");
  }

  const routes = [
    ...new Set(item.medications.map((med) => med.route).filter(Boolean))
  ];

  return routes.join(" / ");
}

function getCardPresentation(item) {
  if (item.type === "combined") {
    return "";
  }

  const presentation = item.medications
    .map((med) => med.presentation)
    .find(Boolean);

  return presentation || "";
}

function medicationNeedsControls(item) {
  return (
    (Array.isArray(item.options) && item.options.length > 0) ||
    (Array.isArray(item.optionGroups) && item.optionGroups.length > 0) ||
    Boolean(item.requiresQuantityInput)
  );
}

function applyOverrides(baseMedication, overrides) {
  return {
    ...baseMedication,
    ...(overrides || {})
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

  if (!Array.isArray(item.medications) || item.medications.length === 0) {
    missing.push("medications");
  }

  if (Array.isArray(item.options) && item.options.length > 0) {
    if (!state.selections.option) {
      missing.push("option");
    } else if (
      !item.options.some((option) => option.id === state.selections.option)
    ) {
      missing.push("option");
    }
  }

  if (Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
    item.optionGroups.forEach((group) => {
      if (!group.required) {
        return;
      }

      const selectedId = state.selections[group.id];

      if (!selectedId) {
        missing.push(group.id);
        return;
      }

      const exists = Array.isArray(group.options)
        ? group.options.some((option) => option.id === selectedId)
        : false;

      if (!exists) {
        missing.push(group.id);
      }
    });
  }

  if (item.requiresQuantityInput && !isPositiveIntegerQuantity(state.quantity)) {
    missing.push("quantity");
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      medicationId: item.id,
      patientName
    };
  }

  let selectedOption = null;

  if (Array.isArray(item.options) && item.options.length > 0) {
    selectedOption = item.options.find(
      (option) => option.id === state.selections.option
    );

    if (!selectedOption) {
      return {
        valid: false,
        missing: ["option"],
        medicationId: item.id,
        patientName
      };
    }
  }

  const medications = item.medications.map((medication) => {
    let resolved = { ...medication };

    if (selectedOption) {
      resolved = applyOverrides(resolved, selectedOption.overrides);
    }

    if (Array.isArray(item.optionGroups)) {
      item.optionGroups.forEach((group) => {
        const selectedId = state.selections[group.id];
        if (!selectedId) {
          return;
        }

        const groupOption = group.options.find(
          (option) => option.id === selectedId
        );

        if (groupOption) {
          resolved = applyOverrides(resolved, groupOption.overrides);
        }
      });
    }

    if (item.requiresQuantityInput) {
      const quantityLabel = `${state.quantity} ampola${
        Number(state.quantity) === 1 ? "" : "s"
      }`;
      const presentationSuffix = resolved.presentation
        ? ` (${resolved.presentation})`
        : "";

      resolved = {
        ...resolved,
        quantity: quantityLabel,
        posology: `${quantityLabel}${presentationSuffix}`
      };
    }

    return resolved;
  });

  if (
    medications.length === 0 ||
    medications.some(
      (medication) =>
        !medication ||
        typeof medication.name !== "string" ||
        medication.name.trim() === ""
    )
  ) {
    return {
      valid: false,
      missing: ["medications"],
      medicationId: item.id,
      patientName
    };
  }

  if (item.requiresQuantityInput) {
    const quantityApplied = medications.every(
      (medication) =>
        String(medication.quantity || "").trim() !== "" &&
        String(medication.posology || "").trim() !== ""
    );

    if (!quantityApplied) {
      return {
        valid: false,
        missing: ["quantity"],
        medicationId: item.id,
        patientName
      };
    }
  }

  return {
    valid: true,
    patientName,
    medicationId: item.id,
    label: item.label,
    shortLabel: item.shortLabel || item.label,
    medications,
    indication: item.indication || "",
    notes: item.notes || ""
  };
}

function buildRequestSignature(resolved) {
  if (!resolved || resolved.valid !== true || !resolved.medicationId) {
    return null;
  }

  const parts = [
    normalizePatientName(resolved.patientName).toLowerCase(),
    resolved.medicationId
  ];

  Object.keys(state.selections)
    .sort()
    .forEach((key) => {
      parts.push(`${key}=${state.selections[key]}`);
    });

  if (state.quantity !== null && state.quantity !== undefined) {
    parts.push(`qty=${state.quantity}`);
  }

  return parts.join("|");
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
        presentation: String(medication.presentation || "").trim(),
        quantity: String(medication.quantity || "").trim(),
        route: String(medication.route || "").trim(),
        posology: String(medication.posology || "").trim()
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
    notes: String(resolved.notes || "").trim(),
    date: formatDateBR(issuedAt),
    time: formatTimeBR(issuedAt)
  };
}

function showAppStatus(message, variant) {
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

  statusTimeoutId = window.setTimeout(() => {
    status.hidden = true;
    status.textContent = "";
    status.classList.remove("is-success", "is-error", "is-progress");
    statusTimeoutId = null;
  }, 2800);
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

function getMissingSelectionHint(item) {
  if (!item) {
    return "";
  }

  if (item.requiresQuantityInput && !isPositiveIntegerQuantity(state.quantity)) {
    return "Informe a quantidade de ampolas";
  }

  if (Array.isArray(item.options) && item.options.length > 0) {
    if (!state.selections.option) {
      return "Selecione a dose";
    }
  }

  if (Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
    const missing = item.optionGroups.filter(
      (group) => group.required && !state.selections[group.id]
    );

    if (missing.length === 0) {
      return "";
    }

    if (missing.length > 1) {
      return `Selecione ${missing
        .map((group) => group.label.toLowerCase())
        .join(" e ")}`;
    }

    return `Selecione ${missing[0].label.toLowerCase()}`;
  }

  return "";
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

function createOptionPill(option, isSelected, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "option-pill";
  button.textContent = option.label;
  button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  button.disabled = state.downloadInFlight;

  if (isSelected) {
    button.classList.add("is-selected");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();

    if (state.downloadInFlight) {
      return;
    }

    onSelect(option.id);
  });

  return button;
}

function createSimpleOptionsControls(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "medication-controls";

  const hint = getMissingSelectionHint(item);

  if (hint) {
    const hintEl = document.createElement("p");
    hintEl.className = "medication-controls__hint";
    hintEl.textContent = hint;
    wrapper.appendChild(hintEl);
  }

  const label = document.createElement("p");
  label.className = "medication-controls__label";
  label.textContent = "Dose";
  wrapper.appendChild(label);

  const pills = document.createElement("div");
  pills.className = "option-pills";
  pills.setAttribute("role", "group");
  pills.setAttribute("aria-label", "Dose");

  item.options.forEach((option) => {
    const isSelected = state.selections.option === option.id;
    pills.appendChild(
      createOptionPill(option, isSelected, (optionId) => {
        state.selections = { option: optionId };
        syncMedicationUI();
        tryFinalizeMedicationRequest();
      })
    );
  });

  wrapper.appendChild(pills);
  return wrapper;
}

function createOptionGroupsControls(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "medication-controls";

  const hint = getMissingSelectionHint(item);

  if (hint) {
    const hintEl = document.createElement("p");
    hintEl.className = "medication-controls__hint";
    hintEl.textContent = hint;
    wrapper.appendChild(hintEl);
  }

  item.optionGroups.forEach((group) => {
    const groupBlock = document.createElement("div");
    groupBlock.className = "medication-controls__group";

    const label = document.createElement("p");
    label.className = "medication-controls__label";
    label.textContent = group.label;
    groupBlock.appendChild(label);

    const pills = document.createElement("div");
    pills.className = "option-pills";
    pills.setAttribute("role", "group");
    pills.setAttribute("aria-label", group.label);

    group.options.forEach((option) => {
      const isSelected = state.selections[group.id] === option.id;
      pills.appendChild(
        createOptionPill(option, isSelected, (optionId) => {
          state.selections = {
            ...state.selections,
            [group.id]: optionId
          };
          syncMedicationUI();
          tryFinalizeMedicationRequest();
        })
      );
    });

    groupBlock.appendChild(pills);
    wrapper.appendChild(groupBlock);
  });

  return wrapper;
}

function createQuantityControls(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "medication-controls";

  const hint = getMissingSelectionHint(item);

  if (hint) {
    const hintEl = document.createElement("p");
    hintEl.className = "medication-controls__hint";
    hintEl.textContent = hint;
    wrapper.appendChild(hintEl);
  }

  const fieldId = `quantity-${item.id}`;

  const label = document.createElement("label");
  label.className = "medication-controls__label";
  label.setAttribute("for", fieldId);
  label.textContent = "Quantidade de ampolas";
  wrapper.appendChild(label);

  const input = document.createElement("input");
  input.id = fieldId;
  input.className = "quantity-input";
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.inputMode = "numeric";
  input.placeholder = "Ex.: 2";
  input.autocomplete = "off";
  input.disabled = state.downloadInFlight;

  if (isPositiveIntegerQuantity(state.quantity)) {
    input.value = String(state.quantity);
  }

  const commitQuantity = () => {
    if (state.downloadInFlight) {
      return;
    }

    state.quantity = parseQuantityInput(input.value);
    syncMedicationUI();

    if (isPositiveIntegerQuantity(state.quantity)) {
      tryFinalizeMedicationRequest();
    }
  };

  input.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  input.addEventListener("input", () => {
    state.quantity = parseQuantityInput(input.value);

    const liveHint = wrapper.querySelector(".medication-controls__hint");
    const nextHint = getMissingSelectionHint(item);

    if (liveHint && nextHint) {
      liveHint.textContent = nextHint;
    } else if (liveHint && !nextHint) {
      liveHint.remove();
    }
  });

  input.addEventListener("change", () => {
    commitQuantity();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitQuantity();
    }
  });

  wrapper.appendChild(input);
  return wrapper;
}

function createMedicationCard(item) {
  const isSelected = state.selectedMedicationId === item.id;
  const patientReady = isPatientNameValid();
  const interactive = patientReady && !state.downloadInFlight;
  const meta = getMedicationCardMeta(item);
  const presentation = getCardPresentation(item);
  const title = item.shortLabel || item.label;

  const card = document.createElement("article");
  card.className = "medication-card";
  card.dataset.medicationId = item.id;

  if (isSelected) {
    card.classList.add("is-selected");
  }

  if (!interactive) {
    card.classList.add("is-disabled");
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "medication-card__trigger";
  trigger.setAttribute("aria-pressed", isSelected ? "true" : "false");
  trigger.setAttribute("aria-disabled", interactive ? "false" : "true");
  trigger.disabled = !interactive;

  const titleEl = document.createElement("span");
  titleEl.className = "medication-card__title";
  titleEl.textContent = title;
  trigger.appendChild(titleEl);

  if (presentation) {
    const presentationEl = document.createElement("span");
    presentationEl.className = "medication-card__detail";
    presentationEl.textContent = presentation;
    trigger.appendChild(presentationEl);
  }

  if (meta) {
    const metaEl = document.createElement("span");
    metaEl.className = "medication-card__meta";
    metaEl.textContent = meta;
    trigger.appendChild(metaEl);
  }

  trigger.addEventListener("click", () => {
    if (!isPatientNameValid() || state.downloadInFlight) {
      return;
    }

    selectMedication(item.id);
  });

  card.appendChild(trigger);

  if (isSelected && medicationNeedsControls(item)) {
    if (Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
      card.appendChild(createOptionGroupsControls(item));
    } else if (Array.isArray(item.options) && item.options.length > 0) {
      card.appendChild(createSimpleOptionsControls(item));
    }

    if (item.requiresQuantityInput) {
      card.appendChild(createQuantityControls(item));
    }
  }

  return card;
}

function selectMedication(medicationId) {
  if (state.downloadInFlight) {
    return;
  }

  const isNewSelection = state.selectedMedicationId !== medicationId;

  if (isNewSelection) {
    state.selectedMedicationId = medicationId;
    state.selections = {};
    state.quantity = null;
  }

  syncMedicationUI();

  const item = getMedicationById(medicationId);

  if (!item) {
    return;
  }

  if (!medicationNeedsControls(item)) {
    tryFinalizeMedicationRequest();
  }
}

function renderMedicationCatalog() {
  const grid = document.getElementById("medications-grid");

  if (!grid || typeof MEDICATIONS === "undefined") {
    return;
  }

  grid.innerHTML = "";

  MEDICATIONS.forEach((item) => {
    grid.appendChild(createMedicationCard(item));
  });
}

function updateMedicationSectionState() {
  const section = document.getElementById("medications-section");
  const hint = document.getElementById("medications-hint");

  if (!section || !hint) {
    return;
  }

  const isValid = isPatientNameValid();

  if (!isValid) {
    clearMedicationSelection();
    state.lastDownloadedSignature = null;
  }

  section.classList.toggle("is-disabled", !isValid);
  hint.textContent = isValid
    ? MSG_MEDICATIONS_ENABLED
    : MSG_MEDICATIONS_DISABLED;
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
    syncMedicationUI();
  });

  input.addEventListener("blur", () => {
    const normalized = normalizePatientName(input.value);

    if (input.value === normalized && state.patientName === normalized) {
      return;
    }

    input.value = normalized;
    state.patientName = normalized;
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
