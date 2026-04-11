import { Building2, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { vendorStore, type VendorProfile } from "@/lib/vendorStore";

interface Props {
  refreshKey: number; // triggers re-render when history changes
}

const trendIcons = {
  stable: Minus,
  increasing: TrendingUp,
  decreasing: TrendingDown,
  spike: AlertTriangle,
};

const trendColors = {
  stable: "text-muted-foreground",
  increasing: "text-warning",
  decreasing: "text-safe",
  spike: "text-danger",
};

const VendorProfiles = ({ refreshKey }: Props) => {
  const profiles = vendorStore.getAllProfiles();

  if (profiles.length === 0) return null;

  const getRiskBadge = (score: number) => {
    if (score >= 60) return { label: "High Risk", cls: "bg-danger/10 text-danger border-danger/20" };
    if (score >= 30) return { label: "Medium Risk", cls: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Low Risk", cls: "bg-safe/10 text-safe border-safe/20" };
  };

  return (
    <Card className="shadow-lg border-0 shadow-primary/5 animate-fade-in" key={refreshKey}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          Vendor Risk Profiles
          <Badge variant="secondary" className="ml-auto">{profiles.length} vendors</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {profiles.map((p) => {
            const badge = getRiskBadge(p.riskScore);
            const TrendIcon = trendIcons[p.trend];
            return (
              <div key={p.vendorName} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm truncate">{p.vendorName}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${badge.cls}`}>{badge.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Invoices</p>
                    <p className="font-semibold">{p.totalInvoices}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Avg Amount</p>
                    <p className="font-semibold">${p.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Flags</p>
                    <p className="font-semibold">{p.fraudCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Risk</span>
                  <Progress value={p.riskScore} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium w-8 text-right">{p.riskScore}%</span>
                  <TrendIcon className={`h-3.5 w-3.5 shrink-0 ${trendColors[p.trend]}`} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorProfiles;
