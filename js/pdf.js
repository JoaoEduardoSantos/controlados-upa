"use strict";

/**
 * PDF “PuxaFicha Compact” — meia página A4 (via superior).
 * Arquitetura: cabeçalho institucional + coluna lateral (paciente/indicação)
 * + coluna editorial principal (título → medicamento → posologia → assinatura).
 * Geometria em mm; tamanhos de fonte em pt (jsPDF).
 */
const PDF_PAGE = {
  width: 210,
  height: 297,
  marginX: 14,
  contentWidth: 182,
  contentRight: 196,
};

const PDF_LAYOUT = {
  headerTop: 13,
  headerBottom: 39,

  mainTop: 49,

  sideLeft: 14,
  sideWidth: 44,
  dividerX: 60,

  mainX: 66,
  mainRight: 196,
  mainWidth: 130,
  medLabelWidth: 34,

  titleTop: 49,
  medicationTop: 72,
  posologyTop: 94,

  signatureY: 124,
  dividerBottom: 110,

  footerBottom: 146,
  cutY: 148.5,

  logoMaxWidth: 40,
  logoMaxHeight: 28,
  logoX: 15,
  textBlockX: 60,

  signatureWidth: 66,

  footerMaxWidth: 112,
  footerMaxHeight: 9,
};

const PDF_COLOR = {
  primary: [17, 24, 39], // #111827
  secondary: [96, 103, 112], // #606770
  tertiary: [138, 144, 153], // #8A9099
  muted: [113, 120, 130], // endereço / telefone
  date: [115, 122, 132], // #737A84
  posology: [75, 85, 99], // #4B5563
  divider: [225, 228, 232], // #E1E4E8
  cut: [174, 180, 188], // #AEB4BC
  white: [255, 255, 255],
  black: [0, 0, 0],
};

/** Estilos da coluna de valores do bloco de medicação (rótulos ficam intactos). */
const MEDICATION_VALUE_STYLE = {
  medication: {
    style: "bold",
    size: 13.2,
    color: PDF_COLOR.primary,
    lineHeight: 5.3,
    maxLines: 2,
    afterGap: 2.0,
  },
  route: {
    style: "normal",
    size: 9,
    color: PDF_COLOR.secondary,
    lineHeight: 4.0,
    maxLines: 2,
    afterGap: 2.0,
  },
  posology: {
    style: "semibold",
    size: 9.4,
    color: PDF_COLOR.posology,
    lineHeight: 4.1,
    maxLines: 3,
    afterGap: 2.0,
  },
  indication: {
    style: "normal",
    size: 9,
    color: PDF_COLOR.secondary,
    lineHeight: 3.9,
    maxLines: 4,
    afterGap: 2.0,
  },
};

/** Tracking negativo global (mm) — aproxima o kerning editorial do PuxaFicha. */
const PDF_CHAR_SPACE = -0.12;

const imageDataUrlCache = Object.create(null);
const fontBase64Cache = Object.create(null);

const PDF_FONT_FAMILY = "SFPro";
const PDF_FONT_FILES = {
  normal: "./fonts/SFPro-Regular.ttf",
  medium: "./fonts/SFPro-Medium.ttf",
  semibold: "./fonts/SFPro-Semibold.ttf",
  bold: "./fonts/SFPro-Bold.ttf",
};

function getJsPdfConstructor() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
    return window.jspdf.jsPDF;
  }

  if (typeof window.jsPDF === "function") {
    return window.jsPDF;
  }

  return null;
}

function isValidMedicationDocumentModel(model) {
  return Boolean(
    model &&
    typeof model === "object" &&
    model.unit &&
    typeof model.unit.name === "string" &&
    model.unit.name.trim() !== "" &&
    typeof model.unit.type === "string" &&
    model.unit.type.trim() !== "" &&
    typeof model.patientName === "string" &&
    model.patientName.trim() !== "" &&
    Array.isArray(model.medications) &&
    model.medications.length > 0 &&
    model.medications.every(
      (medication) =>
        medication &&
        typeof medication.name === "string" &&
        medication.name.trim() !== "",
    ) &&
    typeof model.date === "string" &&
    typeof model.time === "string",
  );
}

function slugifyPdfToken(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildMedicationPdfFilename(documentModel) {
  if (!isValidMedicationDocumentModel(documentModel)) {
    return "controlado-solicitacao.pdf";
  }

  const patient =
    slugifyPdfToken(documentModel.patientName).slice(0, 48) || "paciente";
  const medication =
    slugifyPdfToken(
      documentModel.medications.map((item) => item.name).join(" "),
    ).slice(0, 56) || "medicamento";
  const date = slugifyPdfToken(documentModel.date) || "data";

  return `controlado-${patient}-${medication}-${date}.pdf`;
}

function getImageFormatFromDataUrl(dataUrl) {
  if (
    String(dataUrl).startsWith("data:image/jpeg") ||
    String(dataUrl).startsWith("data:image/jpg")
  ) {
    return "JPEG";
  }

  return "PNG";
}

function fitImageWithinBox(naturalWidth, naturalHeight, maxWidth, maxHeight) {
  const ratio = naturalWidth / naturalHeight;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width,
    height,
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function measureDataUrlImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) {
        reject(new Error("Imagem sem dimensões válidas"));
        return;
      }
      resolve({ width, height });
    };
    image.onerror = () => reject(new Error("Falha ao medir imagem"));
    image.src = dataUrl;
  });
}

async function buildImagePayloadFromDataUrl(dataUrl) {
  const { width, height } = await measureDataUrlImage(dataUrl);
  return {
    dataUrl,
    format: getImageFormatFromDataUrl(dataUrl),
    width,
    height,
  };
}

async function loadImageViaFetch(path) {
  if (typeof fetch !== "function") {
    return null;
  }

  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  return buildImagePayloadFromDataUrl(dataUrl);
}

async function loadImageViaXhr(path) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    xhr.responseType = "blob";
    xhr.onload = () => {
      if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
        resolve(xhr.response);
        return;
      }
      reject(new Error(`XHR ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("XHR network error"));
    xhr.send();
  });

  const dataUrl = await blobToDataUrl(blob);
  return buildImagePayloadFromDataUrl(dataUrl);
}

function loadImageViaCanvas(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;

        if (!width || !height) {
          reject(new Error("Imagem sem dimensões válidas"));
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas 2D indisponível"));
          return;
        }

        context.drawImage(image, 0, 0);

        const isJpeg = /\.jpe?g($|\?)/i.test(path);
        const dataUrl = isJpeg
          ? canvas.toDataURL("image/jpeg", 0.92)
          : canvas.toDataURL("image/png");

        resolve({
          dataUrl,
          format: getImageFormatFromDataUrl(dataUrl),
          width,
          height,
        });
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => reject(new Error("Falha ao carregar <img>"));
    image.src = path;
  });
}

function loadEmbeddedImageFallback(path) {
  if (typeof EMBEDDED_IMAGES === "undefined" || !EMBEDDED_IMAGES) {
    return null;
  }

  const dataUrl = EMBEDDED_IMAGES[path];
  if (!dataUrl) {
    return null;
  }

  return buildImagePayloadFromDataUrl(dataUrl);
}

function loadImageAsDataUrl(src) {
  return new Promise((resolve) => {
    const path = String(src || "").trim();

    if (!path) {
      resolve(null);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(imageDataUrlCache, path)) {
      resolve(imageDataUrlCache[path]);
      return;
    }

    (async () => {
      const attempts = [
        () => loadImageViaFetch(path),
        () => loadImageViaXhr(path),
        () => loadImageViaCanvas(path),
        () => loadEmbeddedImageFallback(path),
      ];

      for (const attempt of attempts) {
        try {
          const payload = await attempt();
          if (payload && payload.dataUrl) {
            imageDataUrlCache[path] = payload;
            resolve(payload);
            return;
          }
        } catch (error) {
          // tenta o próximo método (file:// / CORS / canvas tainted)
        }
      }

      console.warn(`[pdf] Não foi possível carregar a imagem: ${path}`);
      imageDataUrlCache[path] = null;
      resolve(null);
    })();
  });
}

function pdfRgb(color) {
  return color || PDF_COLOR.primary;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function loadFontBase64ViaFetch(path) {
  if (typeof fetch !== "function") {
    return null;
  }

  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
}

async function loadFontBase64ViaXhr(path) {
  const buffer = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
        resolve(xhr.response);
        return;
      }
      reject(new Error(`XHR ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("XHR network error"));
    xhr.send();
  });

  return arrayBufferToBase64(buffer);
}

function loadEmbeddedFontFallback(path) {
  if (typeof EMBEDDED_FONTS === "undefined" || !EMBEDDED_FONTS) {
    return null;
  }

  return EMBEDDED_FONTS[path] || null;
}

function loadFontBase64(src) {
  return new Promise((resolve) => {
    const path = String(src || "").trim();

    if (!path) {
      resolve(null);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(fontBase64Cache, path)) {
      resolve(fontBase64Cache[path]);
      return;
    }

    (async () => {
      const attempts = [
        () => loadFontBase64ViaFetch(path),
        () => loadFontBase64ViaXhr(path),
        () => Promise.resolve(loadEmbeddedFontFallback(path)),
      ];

      for (const attempt of attempts) {
        try {
          const base64 = await attempt();
          if (base64) {
            fontBase64Cache[path] = base64;
            resolve(base64);
            return;
          }
        } catch (error) {
          // tenta o próximo método
        }
      }

      console.warn(`[pdf] Não foi possível carregar a fonte: ${path}`);
      fontBase64Cache[path] = null;
      resolve(null);
    })();
  });
}

async function ensureSfProFonts(doc) {
  if (doc.__sfProFontsReady) {
    return Boolean(doc.__sfProFontsLoaded);
  }

  doc.__sfProFontsReady = true;
  let loadedCount = 0;

  const entries = Object.entries(PDF_FONT_FILES);
  for (let i = 0; i < entries.length; i += 1) {
    const style = entries[i][0];
    const path = entries[i][1];
    const fileName = path.split("/").pop();
    const base64 = await loadFontBase64(path);

    if (!base64) {
      continue;
    }

    try {
      doc.addFileToVFS(fileName, base64);
      doc.addFont(fileName, PDF_FONT_FAMILY, style);
      loadedCount += 1;
    } catch (error) {
      console.warn(`[pdf] Falha ao registrar a fonte ${fileName}.`, error);
    }
  }

  doc.__sfProFontsLoaded = loadedCount === entries.length;

  if (!doc.__sfProFontsLoaded) {
    console.warn(
      `[pdf] SF Pro incompleto (${loadedCount}/${entries.length}); fallback Helvetica.`,
    );
  }

  return doc.__sfProFontsLoaded;
}

function resolvePdfFontStyle(style) {
  if (style === "medium" || style === "semibold" || style === "bold") {
    return style;
  }

  return "normal";
}

/**
 * SF Pro (Regular / Medium / Semibold / Bold). Fallback Helvetica se as
 * fontes não carregarem.
 */
function pdfSetFont(doc, style, size, color) {
  const mapped = resolvePdfFontStyle(style);

  if (doc.__sfProFontsLoaded) {
    doc.setFont(PDF_FONT_FAMILY, mapped);
  } else {
    const helveticaStyle =
      mapped === "bold" || mapped === "semibold" || mapped === "medium"
        ? "bold"
        : "normal";
    doc.setFont("helvetica", helveticaStyle);
  }

  doc.setFontSize(size);
  const rgb = pdfRgb(color);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function pdfDrawRightAlignedLines(doc, lines, x, y, lineHeight) {
  const list = Array.isArray(lines) ? lines : [String(lines ?? "")];
  list.forEach((line, index) => {
    doc.text(String(line), x, y + index * lineHeight, { align: "right" });
  });
  return y + Math.max(list.length, 1) * lineHeight;
}

/**
 * Valor de posologia para o PDF.
 */
function formatPosologyValue(medication) {
  return String(medication.posology || "").trim();
}

/**
 * Unidade de dispensação no singular/plural (ex.: "1 ampola", "4 ampolas").
 */
function formatDispenseUnit(medication, quantity) {
  const amount = Number(quantity);
  const singular = String(medication.unitSingular || "").trim();
  const plural = String(medication.unitPlural || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const unit = amount === 1 ? singular : plural || singular;
  if (!unit) {
    return String(amount);
  }

  return `${amount} ${unit}`;
}

function drawInstitutionalHeader(doc, documentModel, logoImage) {
  const left = PDF_LAYOUT.logoX;
  const textX = PDF_LAYOUT.textBlockX;
  const unit = documentModel.unit;
  const groupTop = PDF_LAYOUT.headerTop;

  let logoHeight = 0;
  let logoBox = null;

  if (logoImage && logoImage.dataUrl) {
    logoBox = fitImageWithinBox(
      logoImage.width,
      logoImage.height,
      PDF_LAYOUT.logoMaxWidth,
      PDF_LAYOUT.logoMaxHeight,
    );
    logoHeight = logoBox.height;
  }

  const badgeLabel = String(unit.type || "").trim();
  const name = String(unit.name || "").trim();
  const city = String(unit.city || "").trim();
  const address = String(unit.address || "").trim();
  const phone = String(unit.phone || "").trim();

  const badgePaddingX = 1.1;
  const badgePaddingY = 0.65;
  const badgeFontSize = 6.5;
  const badgeCharSpace = -0.06;
  const afterBadge = 1.45;
  const afterName = 0.98;
  const afterCity = 0.76;
  const afterAddress = 0.62;
  const nameFontSize = 18;
  const nameLine = 6.5;
  const nameCharSpace = -0.45;
  const cityLine = 3.96;
  const metaLine = 3.66;
  let textBlockHeight = 0;

  if (badgeLabel) {
    textBlockHeight += badgeFontSize * 0.3528 + badgePaddingY * 2 + afterBadge;
  }
  if (name) {
    textBlockHeight += nameLine + afterName;
  }
  if (city) {
    textBlockHeight += cityLine + afterCity;
  }
  if (address) {
    textBlockHeight += metaLine + afterAddress;
  }
  if (phone) {
    textBlockHeight += metaLine;
  }

  const groupHeight = Math.max(logoHeight, textBlockHeight);
  const logoY = groupTop + (groupHeight - logoHeight) / 2;
  let y = groupTop + (groupHeight - textBlockHeight) / 2;

  if (logoBox && logoImage && logoImage.dataUrl) {
    try {
      doc.addImage(
        logoImage.dataUrl,
        logoImage.format,
        left,
        logoY,
        logoBox.width,
        logoBox.height,
      );
    } catch (error) {
      console.warn("[pdf] Falha ao inserir o logo institucional.", error);
    }
  }

  if (badgeLabel) {
    pdfSetFont(doc, "bold", badgeFontSize, PDF_COLOR.white);
    doc.setCharSpace(badgeCharSpace);
    const badgeTextWidth = doc.getTextWidth(badgeLabel);
    const badgeWidth = badgeTextWidth + badgePaddingX * 2;
    const badgeHeight = badgeFontSize * 0.3528 + badgePaddingY * 2;
    const badgeTop = y;

    doc.setFillColor(
      PDF_COLOR.primary[0],
      PDF_COLOR.primary[1],
      PDF_COLOR.primary[2],
    );
    doc.roundedRect(textX, badgeTop, badgeWidth, badgeHeight, 0.35, 0.35, "F");
    doc.text(badgeLabel, textX + badgePaddingX, badgeTop + badgeHeight - 1.0);
    doc.setCharSpace(PDF_CHAR_SPACE);
    y += badgeHeight + afterBadge;
  }

  if (name) {
    pdfSetFont(doc, "bold", nameFontSize, PDF_COLOR.primary);
    doc.setCharSpace(nameCharSpace);
    doc.text(name, textX, y + 4.8);
    doc.setCharSpace(PDF_CHAR_SPACE);
    y += nameLine + afterName;
  }

  if (city) {
    pdfSetFont(doc, "medium", 8.7, PDF_COLOR.secondary);
    doc.text(city, textX, y + 2.5);
    y += cityLine + afterCity;
  }

  pdfSetFont(doc, "normal", 8.2, PDF_COLOR.muted);

  if (address) {
    doc.text(address, textX, y + 2.35);
    y += metaLine + afterAddress;
  }

  if (phone) {
    doc.text(phone, textX, y + 2.35);
    y += metaLine;
  }

  return Math.max(groupTop + groupHeight, y);
}

function pdfBaselineFromTop(fontSizePt, topY) {
  // jsPDF posiciona pela baseline; ~0,75 do em converte pt → mm de altura das maiúsculas.
  return topY + fontSizePt * 0.3528 * 0.75;
}

function drawMainDivider(doc) {
  doc.setDrawColor(
    PDF_COLOR.divider[0],
    PDF_COLOR.divider[1],
    PDF_COLOR.divider[2],
  );
  doc.setLineWidth(0.25);
  doc.line(
    PDF_LAYOUT.dividerX,
    PDF_LAYOUT.mainTop,
    PDF_LAYOUT.dividerX,
    PDF_LAYOUT.dividerBottom,
  );
}

function drawSideRail(doc, documentModel) {
  const right = PDF_LAYOUT.dividerX - 7;
  const sideWidth = PDF_LAYOUT.sideWidth;
  const labelSize = 7;
  let y = pdfBaselineFromTop(labelSize, PDF_LAYOUT.mainTop);

  pdfSetFont(doc, "semibold", labelSize, PDF_COLOR.tertiary);
  doc.text("PACIENTE", right, y, { align: "right" });

  y += 7;

  pdfSetFont(doc, "bold", 12.8, PDF_COLOR.primary);
  const patientLines = doc
    .splitTextToSize(String(documentModel.patientName || "").trim(), sideWidth)
    .slice(0, 3);
  y = pdfDrawRightAlignedLines(doc, patientLines, right, y, 5.2);
}

function drawMainTitle(doc, documentModel) {
  const x = PDF_LAYOUT.mainX;
  const titleSize = 19;
  const titleCharSpace = -0.32;
  const titleLineHeight = 6.8;
  let y = pdfBaselineFromTop(titleSize, PDF_LAYOUT.mainTop);

  const title = "Solicitação de Medicamento Controlado";
  pdfSetFont(doc, "bold", titleSize, PDF_COLOR.primary);
  doc.setCharSpace(titleCharSpace);
  const titleLines = doc
    .splitTextToSize(title, PDF_LAYOUT.mainWidth)
    .slice(0, 2);
  doc.text(titleLines, x, y);
  doc.setCharSpace(PDF_CHAR_SPACE);

  y += (titleLines.length - 1) * titleLineHeight + 5.9;

  const date = String(documentModel.date || "").trim();
  const time = String(documentModel.time || "").trim();
  const meta =
    date && time ? `${date}, às ${time}` : date || (time ? `às ${time}` : "");

  if (meta) {
    pdfSetFont(doc, "normal", 8.2, PDF_COLOR.date);
    doc.text(meta, x, y);
  }

  return y + 4;
}

function drawMedicationFieldRow(doc, label, value, startY, options = {}) {
  const text = String(value || "").trim();
  const allowEmpty = Boolean(options.allowEmpty);

  if (!text && !allowEmpty) {
    return startY;
  }

  const labelX = PDF_LAYOUT.mainX;
  const valueX = PDF_LAYOUT.mainX + PDF_LAYOUT.medLabelWidth;
  const valueWidth = Math.max(24, PDF_LAYOUT.mainRight - valueX);
  const valueSize = options.valueSize || 10.5;
  const valueStyle = options.valueStyle || "bold";
  const valueColor = options.valueColor || PDF_COLOR.primary;
  const lineHeight = options.lineHeight || 4.8;
  const maxLines = options.maxLines || 2;

  pdfSetFont(doc, "semibold", 7.2, PDF_COLOR.tertiary);
  doc.text(label, labelX, startY);

  if (text) {
    pdfSetFont(doc, valueStyle, valueSize, valueColor);
    const lines = doc.splitTextToSize(text, valueWidth).slice(0, maxLines);
    doc.text(lines, valueX, startY);
    return (
      startY +
      Math.max(lines.length, 1) * lineHeight +
      (options.afterGap || 1.6)
    );
  }

  return startY + lineHeight + (options.afterGap || 1.6);
}

function drawMedicationBlock(doc, medication, startY, indication) {
  let y = startY;
  const styles = MEDICATION_VALUE_STYLE;

  y = drawMedicationFieldRow(doc, "MEDICAÇÃO", medication.name, y, {
    valueStyle: styles.medication.style,
    valueSize: styles.medication.size,
    valueColor: styles.medication.color,
    lineHeight: styles.medication.lineHeight,
    maxLines: styles.medication.maxLines,
    afterGap: styles.medication.afterGap,
  });

  y = drawMedicationFieldRow(
    doc,
    "POSOLOGIA",
    formatPosologyValue(medication),
    y,
    {
      valueStyle: styles.posology.style,
      valueSize: styles.posology.size,
      valueColor: styles.posology.color,
      lineHeight: styles.posology.lineHeight,
      maxLines: styles.posology.maxLines,
      afterGap: styles.posology.afterGap,
    },
  );

  y = drawMedicationFieldRow(
    doc,
    "QUANTIDADE",
    formatDispenseUnit(medication, medication.quantity),
    y,
    {
      valueStyle: styles.posology.style,
      valueSize: styles.posology.size,
      valueColor: styles.posology.color,
      lineHeight: styles.posology.lineHeight,
      maxLines: styles.posology.maxLines,
      afterGap: styles.posology.afterGap,
    },
  );

  y = drawMedicationFieldRow(doc, "VIA DE ADM", medication.route, y, {
    valueStyle: styles.route.style,
    valueSize: styles.route.size,
    valueColor: styles.route.color,
    lineHeight: styles.route.lineHeight,
    maxLines: styles.route.maxLines,
    afterGap: styles.route.afterGap,
  });

  // `null` omite a linha (itens intermediários em listas com vários medicamentos).
  if (indication !== null && indication !== undefined) {
    y = drawMedicationFieldRow(doc, "INDICAÇÃO", indication, y, {
      valueStyle: styles.indication.style,
      valueSize: styles.indication.size,
      valueColor: styles.indication.color,
      lineHeight: styles.indication.lineHeight,
      maxLines: styles.indication.maxLines,
      afterGap: styles.indication.afterGap,
      allowEmpty: true,
    });
  }

  return y;
}

function drawSignatureBlock(doc, startY) {
  const right = PDF_LAYOUT.mainRight;
  const stampWidth = PDF_LAYOUT.signatureWidth;
  const stampLeft = right - stampWidth;
  let y = Math.max(startY, PDF_LAYOUT.signatureY);

  // Não invade a faixa do rodapé.
  y = Math.min(y, PDF_LAYOUT.footerBottom - PDF_LAYOUT.footerMaxHeight - 6);

  doc.setDrawColor(
    PDF_COLOR.divider[0],
    PDF_COLOR.divider[1],
    PDF_COLOR.divider[2],
  );
  doc.setLineWidth(0.25);
  doc.line(stampLeft, y, right, y);

  const stampLabel = "Carimbo e assinatura médica";
  pdfSetFont(doc, "normal", 7.5, PDF_COLOR.secondary);
  // Sem tracking: alinha a borda direita do texto exatamente ao fim da linha.
  doc.setCharSpace(0);
  doc.text(stampLabel, right, y + 4, { align: "right" });
  doc.setCharSpace(PDF_CHAR_SPACE);

  return y + 6;
}

function drawFooter(doc, footerImage) {
  if (!footerImage || !footerImage.dataUrl) {
    return;
  }

  const footerBox = fitImageWithinBox(
    footerImage.width,
    footerImage.height,
    Math.min(PDF_PAGE.contentWidth, PDF_LAYOUT.footerMaxWidth),
    PDF_LAYOUT.footerMaxHeight,
  );

  const footerTop = PDF_LAYOUT.footerBottom - footerBox.height;
  const footerX =
    PDF_PAGE.marginX + (PDF_PAGE.contentWidth - footerBox.width) / 2;

  try {
    doc.addImage(
      footerImage.dataUrl,
      footerImage.format,
      footerX,
      footerTop,
      footerBox.width,
      footerBox.height,
    );
  } catch (error) {
    console.warn("[pdf] Falha ao inserir o rodapé institucional.", error);
  }
}

function drawCutLine(doc) {
  const y = PDF_LAYOUT.cutY;
  const left = PDF_PAGE.marginX;
  const right = PDF_PAGE.width - PDF_PAGE.marginX;

  doc.setDrawColor(PDF_COLOR.cut[0], PDF_COLOR.cut[1], PDF_COLOR.cut[2]);
  doc.setLineWidth(0.28);
  doc.setLineDashPattern([0.9, 1.4], 0);
  doc.line(left, y, right, y);
  doc.setLineDashPattern([], 0);
}

function drawMedicationCopy(doc, documentModel, assets) {
  drawInstitutionalHeader(doc, documentModel, assets.logo);
  drawMainDivider(doc);
  drawSideRail(doc, documentModel);
  drawMainTitle(doc, documentModel);

  let y = PDF_LAYOUT.medicationTop;
  const indication = String(documentModel.indication || "").trim();
  const medications = documentModel.medications;

  medications.forEach((medication, index) => {
    if (index > 0) {
      y += 5;
    }

    // INDICAÇÃO sempre no último item (rótulo visível mesmo sem texto).
    const rowIndication = index === medications.length - 1 ? indication : null;
    y = drawMedicationBlock(doc, medication, y, rowIndication);
  });

  drawSignatureBlock(doc, Math.max(y + 8, PDF_LAYOUT.signatureY));
  drawFooter(doc, assets.footer);
}

async function generateMedicationPdf(documentModel) {
  const JsPDF = getJsPdfConstructor();

  if (!JsPDF) {
    throw new Error("jsPDF não está carregado.");
  }

  if (typeof validateAppConfig === "function" && !validateAppConfig()) {
    throw new Error("Configuração institucional inválida.");
  }

  if (!isValidMedicationDocumentModel(documentModel)) {
    throw new Error("Modelo de documento inválido para geração de PDF.");
  }

  const [logoImage, footerImage] = await Promise.all([
    loadImageAsDataUrl(documentModel.unit.logo),
    loadImageAsDataUrl(documentModel.unit.footer),
  ]);

  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  await ensureSfProFonts(doc);
  doc.setCharSpace(PDF_CHAR_SPACE);

  const assets = {
    logo: logoImage,
    footer: footerImage,
  };

  // Uma única via na metade superior; metade inferior em branco.
  drawMedicationCopy(doc, documentModel, assets);
  drawCutLine(doc);

  if (
    typeof doc.getNumberOfPages === "function" &&
    doc.getNumberOfPages() > 1
  ) {
    console.warn("[pdf] Mais de uma página foi gerada; esperado apenas 1.");
  }

  return doc;
}

async function downloadMedicationPdf(documentModel) {
  const doc = await generateMedicationPdf(documentModel);
  const filename = buildMedicationPdfFilename(documentModel);
  doc.save(filename);
  return filename;
}
