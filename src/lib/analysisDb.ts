import { supabase } from "@/integrations/supabase/client";
import type { FraudResult, InvoiceInput } from "./fraudEngine";
import type { BehavioralInsight } from "./vendorStore";

export async function saveAnalysis(result: FraudResult) {
  const { error } = await (supabase as any).from("analysis_history").insert({
    invoice_id: result.invoice.invoiceId,
    vendor_name: result.invoice.vendorName,
    amount: result.invoice.amount,
    is_duplicate: result.invoice.isDuplicate,
    vendor_risk_level: result.invoice.vendorRiskLevel,
    fraud_probability: result.fraudProbability,
    confidence_score: result.confidenceScore,
    risk_level: result.riskLevel,
    decision: result.decision,
    explanations: result.explanations as unknown as Record<string, unknown>,
    rule_flags: result.ruleFlags as unknown as Record<string, unknown>,
    behavioral_insights: result.behavioralInsights as unknown as Record<string, unknown>,
    anomaly_score: result.anomalyScore,
    vendor_risk_score: result.vendorRiskScore,
    alert_sent: result.alertSent,
  });
  if (error) console.error("Failed to save analysis:", error);
}

export async function loadHistory(): Promise<FraudResult[]> {
  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error("Failed to load history:", error);
    return [];
  }

  return data.map((row) => ({
    fraudProbability: row.fraud_probability,
    confidenceScore: row.confidence_score,
    riskLevel: row.risk_level as FraudResult["riskLevel"],
    decision: row.decision as FraudResult["decision"],
    explanations: row.explanations as unknown as string[],
    ruleFlags: row.rule_flags as unknown as FraudResult["ruleFlags"],
    behavioralInsights: row.behavioral_insights as unknown as BehavioralInsight[],
    anomalyScore: row.anomaly_score,
    timestamp: new Date(row.created_at),
    invoice: {
      invoiceId: row.invoice_id,
      vendorName: row.vendor_name,
      amount: Number(row.amount),
      isDuplicate: row.is_duplicate,
      vendorRiskLevel: row.vendor_risk_level as InvoiceInput["vendorRiskLevel"],
    },
    alertSent: row.alert_sent,
    vendorRiskScore: row.vendor_risk_score,
  }));
}
