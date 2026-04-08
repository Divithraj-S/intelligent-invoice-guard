import { BarChart3, ShieldCheck, AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FraudResult } from "@/lib/fraudEngine";

interface Props {
  history: FraudResult[];
}

const DashboardStats = ({ history }: Props) => {
  const total = history.length;
  const low = history.filter((r) => r.riskLevel === "low").length;
  const medium = history.filter((r) => r.riskLevel === "medium").length;
  const high = history.filter((r) => r.riskLevel === "high").length;
  const avgProb = total ? Math.round(history.reduce((s, r) => s + r.fraudProbability, 0) / total) : 0;

  const stats = [
    { label: "Total Analyzed", value: total, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: "Approved", value: low, icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
    { label: "Under Review", value: medium, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "Fraud Alerts", value: high, icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
    { label: "Avg. Risk Score", value: `${avgProb}%`, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 shadow-md shadow-primary/5">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className={`p-2 rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
