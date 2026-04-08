import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeFraud, type InvoiceInput, type FraudResult } from "@/lib/fraudEngine";
import { toast } from "sonner";

interface Props {
  onBulkResults: (results: FraudResult[]) => void;
}

const riskBadges: Record<string, string> = {
  low: "bg-safe/10 text-safe border-safe/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-danger/10 text-danger border-danger/20",
};

const CSVUpload = ({ onBulkResults }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<FraudResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const parseCSV = (text: string): InvoiceInput[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const amtIdx = header.findIndex((h) => h.includes("amount"));
    const dupIdx = header.findIndex((h) => h.includes("duplicate"));
    const riskIdx = header.findIndex((h) => h.includes("vendor_risk") || h.includes("risk"));
    const nameIdx = header.findIndex((h) => h.includes("vendor") && !h.includes("risk"));

    if (amtIdx === -1) throw new Error("CSV must contain an 'amount' column");

    return lines.slice(1).filter(l => l.trim()).map((line, i) => {
      const cols = line.split(",").map((c) => c.trim());
      const amount = parseFloat(cols[amtIdx]);
      if (isNaN(amount) || amount <= 0) throw new Error(`Invalid amount on row ${i + 2}`);

      const dupVal = dupIdx >= 0 ? cols[dupIdx]?.toLowerCase() : "no";
      const riskVal = riskIdx >= 0 ? cols[riskIdx]?.toLowerCase() : "low";
      const vendor = nameIdx >= 0 ? cols[nameIdx] : `Vendor-${i + 1}`;

      return {
        invoiceId: `CSV-${Date.now().toString(36).toUpperCase()}-${i}`,
        amount,
        isDuplicate: dupVal === "yes" || dupVal === "true" || dupVal === "1",
        vendorRiskLevel: (["low", "medium", "high"].includes(riskVal) ? riskVal : "low") as "low" | "medium" | "high",
        vendorName: vendor || `Vendor-${i + 1}`,
      };
    });
  };

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setError("");
    setProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const text = await f.text();
      const invoices = parseCSV(text);
      const allResults: FraudResult[] = [];

      for (let i = 0; i < invoices.length; i++) {
        await new Promise((r) => setTimeout(r, 200));
        allResults.push(analyzeFraud(invoices[i]));
        setProgress(Math.round(((i + 1) / invoices.length) * 100));
      }

      setResults(allResults);
      onBulkResults(allResults);
      toast.success(`Processed ${allResults.length} invoices`, {
        description: `${allResults.filter(r => r.riskLevel === "high").length} flagged as high risk`,
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV");
      toast.error("CSV Processing Error", { description: err.message });
    } finally {
      setProcessing(false);
    }
  }, [onBulkResults]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
      processFile(f);
    } else {
      setError("Please upload a CSV file");
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
        <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-primary/40" />
        <p className="font-medium text-sm">Drag & drop CSV file here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse · Supports: .csv</p>
        <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted rounded px-2 py-1 inline-block">
          amount, duplicate, vendor_risk, vendor_name
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-safe" />
          <span>{file.name}</span>
          <Badge variant="secondary" className="ml-auto">{(file.size / 1024).toFixed(1)} KB</Badge>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {processing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Processing invoices...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && (
        <Card className="border-0 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Bulk Results
              <Badge variant="secondary" className="ml-auto">{results.length} invoices</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[350px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Fraud %</TableHead>
                    <TableHead>Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.invoice.vendorName}</TableCell>
                      <TableCell>${r.invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${riskBadges[r.riskLevel]}`}>
                          {r.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.fraudProbability}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${riskBadges[r.riskLevel]}`}>
                          {r.decision}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUpload;
