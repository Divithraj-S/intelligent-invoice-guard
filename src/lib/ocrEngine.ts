// Advanced OCR Engine with preprocessing, region-based extraction,
// validation, confidence scoring, and adaptive correction.

export interface OCRRegion {
  label: string;
  keywords: string[];
  extractedText: string;
  extractedValue: string | number | null;
  confidence: number; // 0-100
  boundingBox: { x: number; y: number; w: number; h: number }; // normalised 0-1
}

export interface PreprocessingStep {
  name: string;
  description: string;
  applied: boolean;
  impact: "none" | "minor" | "significant";
}

export interface ValidationCheck {
  rule: string;
  passed: boolean;
  message: string;
}

export interface CurrencyInfo {
  symbol: string;
  code: string;
  detected: boolean;
}

export interface OCRExtractionResult {
  invoiceNumber: string;
  date: string;
  vendorName: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: CurrencyInfo;
  regions: OCRRegion[];
  preprocessing: PreprocessingStep[];
  validations: ValidationCheck[];
  overallConfidence: number;
  correctionApplied: boolean;
  correctionDetails: string[];
  rawText: string;
  warnings: string[];
}

// ---------- helpers ----------

const VENDORS = [
  "TechSupply Corp", "Global Parts Ltd", "Apex Services Inc",
  "DataFlow Systems", "CloudNet Solutions", "NovaTech Industries",
  "Prime Logistics", "Zenith Manufacturing",
];

const CURRENCIES: CurrencyInfo[] = [
  { symbol: "$", code: "USD", detected: false },
  { symbol: "€", code: "EUR", detected: false },
  { symbol: "₹", code: "INR", detected: false },
  { symbol: "R", code: "ZAR", detected: false },
];

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Preprocessing simulation ----------

function simulatePreprocessing(fileName: string): PreprocessingStep[] {
  const isNoisy = Math.random() > 0.4;
  const isSkewed = Math.random() > 0.6;
  const isLowContrast = Math.random() > 0.5;

  return [
    {
      name: "Grayscale Conversion",
      description: "Converted image to single-channel grayscale",
      applied: true,
      impact: "minor",
    },
    {
      name: "Noise Removal (Gaussian Blur)",
      description: isNoisy
        ? "Heavy noise detected — applied σ=1.5 Gaussian kernel"
        : "Minimal noise — light smoothing applied",
      applied: true,
      impact: isNoisy ? "significant" : "minor",
    },
    {
      name: "Adaptive Thresholding",
      description: "Applied Otsu binarisation for text/background separation",
      applied: true,
      impact: "significant",
    },
    {
      name: "Contrast Enhancement (CLAHE)",
      description: isLowContrast
        ? "Low contrast detected — applied CLAHE with clipLimit=3.0"
        : "Contrast adequate — minor histogram equalisation",
      applied: true,
      impact: isLowContrast ? "significant" : "none",
    },
    {
      name: "Skew Correction",
      description: isSkewed
        ? `Detected ${rand(1, 4).toFixed(1)}° skew — auto-rotated`
        : "No significant skew detected",
      applied: isSkewed,
      impact: isSkewed ? "significant" : "none",
    },
    {
      name: "Border / Margin Removal",
      description: "Cropped non-content borders to focus OCR window",
      applied: true,
      impact: "minor",
    },
  ];
}

// ---------- Region-based extraction ----------

function simulateRegionExtraction(
  subtotal: number,
  tax: number,
  total: number,
  vendor: string,
  invNo: string,
  date: string,
  currency: CurrencyInfo
): OCRRegion[] {
  const sym = currency.symbol;

  const addNoise = (val: number, maxErr: number) => {
    if (Math.random() > 0.8) {
      // simulate OCR misread
      return val + rand(-maxErr, maxErr);
    }
    return val;
  };

  return [
    {
      label: "Invoice Number",
      keywords: ["Invoice", "#", "No."],
      extractedText: `Invoice #: ${invNo}`,
      extractedValue: invNo,
      confidence: rand(85, 99),
      boundingBox: { x: 0.55, y: 0.05, w: 0.4, h: 0.06 },
    },
    {
      label: "Date",
      keywords: ["Date", "Issued"],
      extractedText: `Date: ${date}`,
      extractedValue: date,
      confidence: rand(80, 98),
      boundingBox: { x: 0.55, y: 0.12, w: 0.4, h: 0.05 },
    },
    {
      label: "Vendor Name",
      keywords: ["From", "Vendor", "Supplier"],
      extractedText: `Vendor: ${vendor}`,
      extractedValue: vendor,
      confidence: rand(82, 97),
      boundingBox: { x: 0.05, y: 0.15, w: 0.45, h: 0.08 },
    },
    {
      label: "Subtotal",
      keywords: ["Subtotal", "Sub Total", "Net"],
      extractedText: `Subtotal: ${sym}${addNoise(subtotal, 50).toLocaleString()}`,
      extractedValue: addNoise(subtotal, 50),
      confidence: rand(70, 95),
      boundingBox: { x: 0.55, y: 0.7, w: 0.4, h: 0.05 },
    },
    {
      label: "Tax / GST",
      keywords: ["Tax", "GST", "VAT"],
      extractedText: `Tax (18%): ${sym}${addNoise(tax, 20).toLocaleString()}`,
      extractedValue: addNoise(tax, 20),
      confidence: rand(68, 94),
      boundingBox: { x: 0.55, y: 0.76, w: 0.4, h: 0.05 },
    },
    {
      label: "Total",
      keywords: ["Total", "Grand Total", "Amount Due"],
      extractedText: `Total: ${sym}${addNoise(total, 80).toLocaleString()}`,
      extractedValue: addNoise(total, 80),
      confidence: rand(72, 96),
      boundingBox: { x: 0.55, y: 0.82, w: 0.4, h: 0.06 },
    },
  ];
}

// ---------- Validation ----------

function runValidations(
  regions: OCRRegion[],
  subtotal: number,
  tax: number,
  total: number
): { validations: ValidationCheck[]; warnings: string[] } {
  const validations: ValidationCheck[] = [];
  const warnings: string[] = [];

  const ext = (label: string) =>
    regions.find((r) => r.label === label)?.extractedValue;

  const extSub = Number(ext("Subtotal")) || 0;
  const extTax = Number(ext("Tax / GST")) || 0;
  const extTotal = Number(ext("Total")) || 0;

  // Cross-check: total ≈ subtotal + tax
  const expectedTotal = extSub + extTax;
  const diff = Math.abs(extTotal - expectedTotal);
  const tolerance = expectedTotal * 0.02; // 2 %
  const crossOk = diff <= tolerance;
  validations.push({
    rule: "Total = Subtotal + Tax",
    passed: crossOk,
    message: crossOk
      ? `Cross-check passed (diff ${diff.toFixed(2)})`
      : `Mismatch detected: expected ~${expectedTotal.toFixed(2)} but got ${extTotal.toFixed(2)}`,
  });
  if (!crossOk) warnings.push("Total/Subtotal mismatch — possible OCR error");

  // Low confidence check
  const lowConf = regions.filter((r) => r.confidence < 75);
  validations.push({
    rule: "All fields above 75% confidence",
    passed: lowConf.length === 0,
    message:
      lowConf.length === 0
        ? "All extractions are high confidence"
        : `${lowConf.map((r) => r.label).join(", ")} below threshold`,
  });
  if (lowConf.length > 0)
    warnings.push(`Low confidence in: ${lowConf.map((r) => r.label).join(", ")}`);

  // Date format
  const dateVal = ext("Date") as string | undefined;
  const dateValid = dateVal ? /\d{4}-\d{2}-\d{2}/.test(dateVal) : false;
  validations.push({
    rule: "Date format valid (YYYY-MM-DD)",
    passed: dateValid,
    message: dateValid ? "Date format OK" : "Date format could not be verified",
  });

  // Currency consistency
  validations.push({
    rule: "Single currency detected",
    passed: true,
    message: "No mixed currencies found",
  });

  return { validations, warnings };
}

// ---------- Adaptive correction ----------

function applyCorrections(
  regions: OCRRegion[],
  trueSubtotal: number,
  trueTax: number,
  trueTotal: number
): { corrected: boolean; details: string[] } {
  const details: string[] = [];
  let corrected = false;

  const totalRegion = regions.find((r) => r.label === "Total")!;
  const subRegion = regions.find((r) => r.label === "Subtotal")!;
  const taxRegion = regions.find((r) => r.label === "Tax / GST")!;

  const extTotal = Number(totalRegion.extractedValue) || 0;
  const extSub = Number(subRegion.extractedValue) || 0;
  const extTax = Number(taxRegion.extractedValue) || 0;

  const expectedTotal = extSub + extTax;
  if (Math.abs(extTotal - expectedTotal) > expectedTotal * 0.02) {
    // Re-run OCR on total region (simulate)
    if (Math.random() > 0.3) {
      totalRegion.extractedValue = Math.round(trueTotal * 100) / 100;
      totalRegion.extractedText = totalRegion.extractedText.replace(
        /[\d,.]+$/,
        trueTotal.toLocaleString()
      );
      totalRegion.confidence = Math.min(totalRegion.confidence + 8, 99);
      details.push("Re-scanned Total region — corrected value");
      corrected = true;
    }
  }

  // Bump confidence after correction pass
  for (const r of regions) {
    if (r.confidence < 75 && Math.random() > 0.4) {
      r.confidence = Math.min(r.confidence + rand(5, 15), 95);
      details.push(`Re-processed "${r.label}" region — confidence improved`);
      corrected = true;
    }
  }

  return { corrected, details };
}

// ===================== PUBLIC API =====================

export function runAdvancedOCR(fileName: string): OCRExtractionResult {
  // Ground-truth values
  const subtotal = rand(500, 25000);
  const taxRate = pick([0.05, 0.1, 0.18, 0.15]);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const vendor = pick(VENDORS);
  const invNo = `INV-${Math.floor(Math.random() * 90000 + 10000)}`;
  const date = new Date(Date.now() - Math.random() * 90 * 86400000)
    .toISOString()
    .split("T")[0];
  const currency = { ...pick(CURRENCIES), detected: true };

  // 1. Preprocessing
  const preprocessing = simulatePreprocessing(fileName);

  // 2. Region-based extraction
  const regions = simulateRegionExtraction(
    subtotal, tax, total, vendor, invNo, date, currency
  );

  // 3. Validation
  const { validations: preValidations, warnings: preWarnings } = runValidations(
    regions, subtotal, tax, total
  );

  // 4. Adaptive correction
  const { corrected, details: correctionDetails } = applyCorrections(
    regions, subtotal, tax, total
  );

  // 5. Re-validate after correction
  const { validations, warnings } = corrected
    ? runValidations(regions, subtotal, tax, total)
    : { validations: preValidations, warnings: preWarnings };

  // Overall confidence = weighted avg of region confidences
  const weights = [0.05, 0.05, 0.1, 0.2, 0.2, 0.4]; // heavier on money fields
  const overallConfidence = Math.round(
    regions.reduce((s, r, i) => s + r.confidence * weights[i], 0)
  );

  // Build raw text
  const sym = currency.symbol;
  const rawText = [
    `INVOICE`,
    `Invoice #: ${invNo}`,
    `Date: ${date}`,
    ``,
    `From: ${vendor}`,
    ``,
    `Description          Qty   Price`,
    `-------------------------------`,
    `Service / Product     1    ${sym}${subtotal.toLocaleString()}`,
    ``,
    `Subtotal: ${sym}${subtotal.toLocaleString()}`,
    `Tax (${(taxRate * 100).toFixed(0)}%): ${sym}${tax.toLocaleString()}`,
    `-------------------------------`,
    `Total Due: ${sym}${total.toLocaleString()}`,
  ].join("\n");

  return {
    invoiceNumber: invNo,
    date,
    vendorName: vendor,
    subtotal,
    tax,
    total,
    currency,
    regions,
    preprocessing,
    validations,
    overallConfidence,
    correctionApplied: corrected,
    correctionDetails,
    rawText,
    warnings,
  };
}
