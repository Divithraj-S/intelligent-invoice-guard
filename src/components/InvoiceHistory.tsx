import { Clock, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FraudResult } from "@/lib/fraudEngine";

interface Props {
  history: FraudResult[];
}

const icons = { low: ShieldCheck, medium: AlertTriangle, high: ShieldAlert };
const colors = { low: "text-safe", medium: "text-warning", high: "text-danger" };
const badges = {
  low: "bg-safe/10 text-safe border-safe/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-danger/10 text-danger border-danger/20",
};

const InvoiceHistory = ({ history }: Props) => {
  if (history.length === 0) return null;

  return (
    <Card className="shadow-lg border-0 shadow-primary/5 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          Analysis History
          <Badge variant="secondary" className="ml-auto">{history.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {history.map((r, i) => {
            const Icon = icons[r.riskLevel];
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                <Icon className={`h-4 w-4 shrink-0 ${colors[r.riskLevel]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.invoice.vendorName}</p>
                  <p className="text-xs text-muted-foreground">{r.invoice.invoiceId} · ${r.invoice.amount.toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className={`text-xs ${badges[r.riskLevel]}`}>
                    {r.decision}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{r.fraudProbability}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHistory;
