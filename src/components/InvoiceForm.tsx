import { useState } from "react";
import { FileText, Send, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { InvoiceInput } from "@/lib/fraudEngine";

interface Props {
  onAnalyze: (input: InvoiceInput) => void;
  isAnalyzing: boolean;
}

const InvoiceForm = ({ onAnalyze, isAnalyzing }: Props) => {
  const [amount, setAmount] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [vendorRisk, setVendorRisk] = useState<"low" | "medium" | "high">("low");
  const [vendorName, setVendorName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid positive amount";
    if (!vendorName.trim()) e.vendorName = "Vendor name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAnalyze({
      invoiceId: `INV-${Date.now().toString(36).toUpperCase()}`,
      amount: Number(amount),
      isDuplicate,
      vendorRiskLevel: vendorRisk,
      vendorName: vendorName.trim(),
    });
  };

  return (
    <Card className="shadow-lg animate-slide-up border-0 shadow-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          Invoice Data Input
        </CardTitle>
        <p className="text-sm text-muted-foreground">Enter invoice details for fraud analysis</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              placeholder="e.g. Acme Corp"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              maxLength={100}
            />
            {errors.vendorName && <p className="text-sm text-destructive">{errors.vendorName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Invoice Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label>Vendor Risk Level</Label>
            <Select value={vendorRisk} onValueChange={(v) => setVendorRisk(v as "low" | "medium" | "high")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low Risk</SelectItem>
                <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                <SelectItem value="high">🔴 High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="duplicate" className="cursor-pointer">Duplicate Invoice</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Has this invoice been submitted before?</p>
            </div>
            <Switch id="duplicate" checked={isDuplicate} onCheckedChange={setIsDuplicate} />
          </div>

          <Button type="submit" className="w-full gap-2" size="lg" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Analyze Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;
