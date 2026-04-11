// Vendor Behavioral Analysis & Risk Profiling Store
// Tracks vendor history, detects anomalies, and maintains risk profiles

export interface VendorProfile {
  vendorName: string;
  totalInvoices: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
  fraudCount: number;
  genuineCount: number;
  riskScore: number; // 0-100
  lastActivity: Date;
  amountHistory: number[];
  frequencyPerMonth: number;
  trend: "stable" | "increasing" | "decreasing" | "spike";
  flagHistory: string[];
}

export interface BehavioralInsight {
  type: "anomaly" | "pattern" | "history" | "frequency";
  severity: "info" | "warning" | "critical";
  message: string;
}

class VendorStore {
  private vendors: Map<string, VendorProfile> = new Map();
  private feedbackLog: { vendorName: string; wasFraud: boolean; timestamp: Date }[] = [];

  getProfile(name: string): VendorProfile | undefined {
    return this.vendors.get(name.toLowerCase());
  }

  getAllProfiles(): VendorProfile[] {
    return Array.from(this.vendors.values()).sort((a, b) => b.riskScore - a.riskScore);
  }

  recordInvoice(vendorName: string, amount: number, wasFlagged: boolean): VendorProfile {
    const key = vendorName.toLowerCase();
    const existing = this.vendors.get(key);

    if (existing) {
      existing.totalInvoices++;
      existing.totalAmount += amount;
      existing.averageAmount = existing.totalAmount / existing.totalInvoices;
      existing.maxAmount = Math.max(existing.maxAmount, amount);
      existing.minAmount = Math.min(existing.minAmount, amount);
      existing.amountHistory.push(amount);
      existing.lastActivity = new Date();
      if (wasFlagged) existing.fraudCount++;

      // Recalculate trend
      existing.trend = this.calculateTrend(existing.amountHistory);

      // Recalculate risk score
      existing.riskScore = this.calculateRiskScore(existing);

      // Recalculate frequency (simplified: invoices per unique "session")
      existing.frequencyPerMonth = Math.min(existing.totalInvoices, 30);

      this.vendors.set(key, existing);
      return existing;
    }

    const profile: VendorProfile = {
      vendorName,
      totalInvoices: 1,
      totalAmount: amount,
      averageAmount: amount,
      maxAmount: amount,
      minAmount: amount,
      fraudCount: wasFlagged ? 1 : 0,
      genuineCount: wasFlagged ? 0 : 1,
      riskScore: wasFlagged ? 40 : 10,
      lastActivity: new Date(),
      amountHistory: [amount],
      frequencyPerMonth: 1,
      trend: "stable",
      flagHistory: wasFlagged ? ["Flagged on first submission"] : [],
    };

    this.vendors.set(key, profile);
    return profile;
  }

  recordFeedback(vendorName: string, wasFraud: boolean) {
    const key = vendorName.toLowerCase();
    const profile = this.vendors.get(key);
    if (profile) {
      if (wasFraud) {
        profile.fraudCount++;
        profile.flagHistory.push(`Marked as fraud at ${new Date().toLocaleTimeString()}`);
      } else {
        profile.genuineCount++;
      }
      profile.riskScore = this.calculateRiskScore(profile);
      this.vendors.set(key, profile);
    }
    this.feedbackLog.push({ vendorName, wasFraud, timestamp: new Date() });
  }

  analyzeBehavior(vendorName: string, currentAmount: number): BehavioralInsight[] {
    const profile = this.getProfile(vendorName.toLowerCase());
    const insights: BehavioralInsight[] = [];

    if (!profile || profile.totalInvoices < 2) {
      insights.push({
        type: "history",
        severity: "info",
        message: "New vendor — no prior history available for behavioral analysis",
      });
      return insights;
    }

    // Anomaly: amount deviation
    const deviation = Math.abs(currentAmount - profile.averageAmount) / (profile.averageAmount || 1);
    if (deviation > 1.5) {
      insights.push({
        type: "anomaly",
        severity: "critical",
        message: `Invoice amount is ${deviation.toFixed(1)}x the vendor average ($${profile.averageAmount.toLocaleString()})`,
      });
    } else if (deviation > 0.8) {
      insights.push({
        type: "anomaly",
        severity: "warning",
        message: `Invoice amount deviates ${(deviation * 100).toFixed(0)}% from vendor average ($${profile.averageAmount.toLocaleString()})`,
      });
    }

    // Pattern: spending trend
    if (profile.trend === "spike") {
      insights.push({
        type: "pattern",
        severity: "critical",
        message: "Sudden spike detected in vendor invoice amounts",
      });
    } else if (profile.trend === "increasing") {
      insights.push({
        type: "pattern",
        severity: "warning",
        message: "Vendor shows consistently increasing invoice amounts",
      });
    }

    // History: fraud rate
    const fraudRate = profile.fraudCount / profile.totalInvoices;
    if (fraudRate > 0.3) {
      insights.push({
        type: "history",
        severity: "critical",
        message: `Vendor has a ${(fraudRate * 100).toFixed(0)}% fraud flag rate (${profile.fraudCount}/${profile.totalInvoices} invoices)`,
      });
    } else if (profile.fraudCount > 0) {
      insights.push({
        type: "history",
        severity: "warning",
        message: `Vendor has ${profile.fraudCount} previous fraud flag(s)`,
      });
    }

    // Frequency
    if (profile.totalInvoices > 5) {
      insights.push({
        type: "frequency",
        severity: "info",
        message: `Vendor has submitted ${profile.totalInvoices} invoices with avg $${profile.averageAmount.toLocaleString()}`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "pattern",
        severity: "info",
        message: "Vendor behavior is consistent with historical patterns",
      });
    }

    return insights;
  }

  private calculateTrend(history: number[]): VendorProfile["trend"] {
    if (history.length < 3) return "stable";
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length === 0) return "stable";

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const ratio = recentAvg / (olderAvg || 1);

    if (ratio > 2) return "spike";
    if (ratio > 1.3) return "increasing";
    if (ratio < 0.7) return "decreasing";
    return "stable";
  }

  private calculateRiskScore(profile: VendorProfile): number {
    let score = 10;
    const fraudRate = profile.fraudCount / profile.totalInvoices;
    score += fraudRate * 50;
    if (profile.trend === "spike") score += 20;
    else if (profile.trend === "increasing") score += 10;
    if (profile.maxAmount > profile.averageAmount * 3) score += 15;
    return Math.min(Math.round(score), 100);
  }

  getFeedbackStats() {
    return {
      total: this.feedbackLog.length,
      fraud: this.feedbackLog.filter((f) => f.wasFraud).length,
      genuine: this.feedbackLog.filter((f) => !f.wasFraud).length,
    };
  }
}

export const vendorStore = new VendorStore();
