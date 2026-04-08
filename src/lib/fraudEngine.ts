export interface InvoiceInput {
  invoiceId: string;
  amount: number;
  isDuplicate: boolean;
  vendorRiskLevel: "low" | "medium" | "high";
  vendorName: string;
}

export interface FraudResult {
  fraudProbability: number;
  confidenceScore: number;
  riskLevel: "low" | "medium" | "high";
  decision: "Approve" | "Review" | "Fraud Alert";
  explanations: string[];
  ruleFlags: { rule: string; triggered: boolean }[];
  timestamp: Date;
  invoice: InvoiceInput;
  alertSent: boolean;
}

export function analyzeFraud(input: InvoiceInput): FraudResult {
  const explanations: string[] = [];
  const ruleFlags: { rule: string; triggered: boolean }[] = [];
  let ruleScore = 0;

  // Rule 1: Duplicate
  const dupTriggered = input.isDuplicate;
  ruleFlags.push({ rule: "Duplicate Invoice Check", triggered: dupTriggered });
  if (dupTriggered) {
    ruleScore += 35;
    explanations.push("Duplicate invoice detected — potential resubmission fraud");
  }

  // Rule 2: High amount
  const highAmount = input.amount > 10000;
  ruleFlags.push({ rule: "High Amount Threshold (>$10,000)", triggered: highAmount });
  if (highAmount) {
    ruleScore += 25;
    explanations.push(`Invoice amount ($${input.amount.toLocaleString()}) exceeds $10,000 threshold`);
  }

  // Rule 3: Vendor risk
  const highVendor = input.vendorRiskLevel === "high";
  const medVendor = input.vendorRiskLevel === "medium";
  ruleFlags.push({ rule: "Vendor Risk Assessment", triggered: highVendor || medVendor });
  if (highVendor) {
    ruleScore += 30;
    explanations.push("Vendor is classified as high risk");
  } else if (medVendor) {
    ruleScore += 15;
    explanations.push("Vendor is classified as medium risk");
  }

  // Simulate ML prediction with some randomness
  const mlBase = ruleScore * 0.8 + Math.random() * 20;
  const mlScore = Math.min(Math.max(mlBase, 5), 98);

  // Combine: 60% ML + 40% rules
  const fraudProbability = Math.round(mlScore * 0.6 + ruleScore * 0.4);
  const confidenceScore = Math.round(70 + Math.random() * 25);

  let riskLevel: FraudResult["riskLevel"];
  let decision: FraudResult["decision"];

  if (fraudProbability >= 60) {
    riskLevel = "high";
    decision = "Fraud Alert";
  } else if (fraudProbability >= 30) {
    riskLevel = "medium";
    decision = "Review";
  } else {
    riskLevel = "low";
    decision = "Approve";
  }

  if (explanations.length === 0) {
    explanations.push("No suspicious patterns detected");
    explanations.push("All validation rules passed successfully");
  }

  return {
    fraudProbability,
    confidenceScore,
    riskLevel,
    decision,
    explanations,
    ruleFlags,
    timestamp: new Date(),
    invoice: input,
    alertSent: riskLevel === "high",
  };
}
