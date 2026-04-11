import { vendorStore, type BehavioralInsight } from "./vendorStore";

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
  decision: "Approve" | "Hold for Review" | "Escalate";
  explanations: string[];
  ruleFlags: { rule: string; triggered: boolean }[];
  behavioralInsights: BehavioralInsight[];
  anomalyScore: number;
  timestamp: Date;
  invoice: InvoiceInput;
  alertSent: boolean;
  vendorRiskScore: number;
}

export function analyzeFraud(input: InvoiceInput): FraudResult {
  const explanations: string[] = [];
  const ruleFlags: { rule: string; triggered: boolean }[] = [];
  let ruleScore = 0;

  // --- Rule-based checks ---

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

  // --- Behavioral Analysis ---
  const behavioralInsights = vendorStore.analyzeBehavior(input.vendorName, input.amount);
  let behaviorScore = 0;
  for (const insight of behavioralInsights) {
    if (insight.severity === "critical") behaviorScore += 20;
    else if (insight.severity === "warning") behaviorScore += 10;
  }

  // Add behavioral explanations
  const criticalInsights = behavioralInsights.filter((i) => i.severity === "critical");
  for (const ci of criticalInsights) {
    explanations.push(ci.message);
  }

  // Behavioral rule flag
  ruleFlags.push({ rule: "Behavioral Anomaly Detection", triggered: behaviorScore > 0 });

  // --- Anomaly Score (Isolation Forest concept) ---
  const vendorProfile = vendorStore.getProfile(input.vendorName.toLowerCase());
  let anomalyScore = 0;
  if (vendorProfile && vendorProfile.totalInvoices >= 2) {
    const deviation = Math.abs(input.amount - vendorProfile.averageAmount) / (vendorProfile.averageAmount || 1);
    anomalyScore = Math.min(Math.round(deviation * 40 + Math.random() * 10), 100);
  } else {
    anomalyScore = Math.round(15 + Math.random() * 15);
  }
  ruleFlags.push({ rule: "Anomaly Score Check (>50)", triggered: anomalyScore > 50 });
  if (anomalyScore > 50) {
    ruleScore += 15;
    if (!criticalInsights.length) {
      explanations.push(`Statistical anomaly detected (score: ${anomalyScore}/100)`);
    }
  }

  // --- ML Simulation ---
  const mlBase = (ruleScore + behaviorScore) * 0.7 + Math.random() * 20;
  const mlScore = Math.min(Math.max(mlBase, 5), 98);

  // Combined: 50% ML + 30% rules + 20% behavior
  const fraudProbability = Math.round(mlScore * 0.5 + ruleScore * 0.3 + behaviorScore * 0.2);
  const confidenceScore = Math.round(65 + Math.min(vendorProfile?.totalInvoices || 0, 10) * 2 + Math.random() * 15);

  // --- Decision ---
  let riskLevel: FraudResult["riskLevel"];
  let decision: FraudResult["decision"];

  if (fraudProbability >= 60) {
    riskLevel = "high";
    decision = "Escalate";
  } else if (fraudProbability >= 30) {
    riskLevel = "medium";
    decision = "Hold for Review";
  } else {
    riskLevel = "low";
    decision = "Approve";
  }

  if (explanations.length === 0) {
    explanations.push("No suspicious patterns detected");
    explanations.push("All validation rules passed successfully");
  }

  // Record in vendor store
  const updatedProfile = vendorStore.recordInvoice(input.vendorName, input.amount, riskLevel === "high");

  return {
    fraudProbability,
    confidenceScore,
    riskLevel,
    decision,
    explanations,
    ruleFlags,
    behavioralInsights,
    anomalyScore,
    timestamp: new Date(),
    invoice: input,
    alertSent: riskLevel === "high",
    vendorRiskScore: updatedProfile.riskScore,
  };
}
