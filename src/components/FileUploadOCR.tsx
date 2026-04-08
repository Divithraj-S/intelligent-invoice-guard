import { useState, useCallback } from "react";
import { FileImage, ScanLine, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { analyzeFraud, type FraudResult } from "@/lib/fraudEngine";
import { toast } from "sonner";

interface Props {
  onResult: (result: FraudResult) => void;
}

interface OCRData {
  invoiceNumber: string;
  date: string;
  vendorName: string;
  amount: number;
  gst: number;
  rawText: string;
}

const simulateOCR = (fileName: string): OCRData => {
  const vendors = ["TechSupply Corp", "Global Parts Ltd", "Apex Services Inc", "DataFlow Systems", "CloudNet Solutions"];
  const amount = Math.round((Math.random() * 25000 + 500) * 100) / 100;
  return {
    invoiceNumber: `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
    date: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split("T")[0],
    vendorName: vendors[Math.floor(Math.random() * vendors.length)],
    amount,
    gst: Math.round(amount * 0.18 * 100) / 100,
    rawText: `INVOICE\n${fileName}\n\nInvoice #: INV-${Math.floor(Math.random() * 90000 + 10000)}\nDate: ${new Date().toLocaleDateString()}\nVendor: ${vendors[Math.floor(Math.random() * vendors.length)]}\nAmount: $${amount.toLocaleString()}\nGST (18%): $${(amount * 0.18).toFixed(2)}\nTotal: $${(amount * 1.18).toFixed(2)}`,
  };
};

const FileUploadOCR = ({ onResult }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setOcrData(null);
    setAnalyzed(false);
    setProcessing(true);
    setProgress(0);

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }

    const stages = [
      { label: "Loading document...", pct: 15 },
      { label: "Running OCR engine...", pct: 40 },
      { label: "Extracting text...", pct: 60 },
      { label: "Identifying fields...", pct: 80 },
      { label: "Preprocessing data...", pct: 95 },
    ];

    for (const s of stages) {
      setStage(s.label);
      setProgress(s.pct);
      await new Promise((r) => setTimeout(r, 600));
    }

    const data = simulateOCR(f.name);
    setOcrData(data);
    setProgress(100);
    setStage("Extraction complete");
    setProcessing(false);
    toast.success("OCR extraction complete", { description: `Extracted ${Object.keys(data).length - 1} fields` });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "application/pdf" || f.type.startsWith("image/"))) {
      processFile(f);
    } else {
      toast.error("Unsupported file type", { description: "Please upload PDF, JPG, or PNG" });
    }
  }, [processFile]);

  const handleAnalyze = () => {
    if (!ocrData) return;
    const riskLevels: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
    const result = analyzeFraud({
      invoiceId: ocrData.invoiceNumber,
      amount: ocrData.amount,
      isDuplicate: Math.random() > 0.7,
      vendorRiskLevel: riskLevels[Math.floor(Math.random() * 3)],
      vendorName: ocrData.vendorName,
    });
    onResult(result);
    setAnalyzed(true);
    toast.success("Fraud analysis complete");
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
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <FileImage className="h-10 w-10 mx-auto mb-3 text-primary/40" />
        <p className="font-medium text-sm">Drag & drop invoice file here</p>
        <p className="text-xs text-muted-foreground mt-1">Supports: PDF, JPG, PNG</p>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span className="truncate">{file.name}</span>
          <Badge variant="secondary" className="ml-auto shrink-0">{(file.size / 1024).toFixed(1)} KB</Badge>
        </div>
      )}

      {processing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground">{stage}</span>
            <span className="ml-auto font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {preview && (
        <div className="rounded-lg overflow-hidden border max-h-[200px]">
          <img src={preview} alt="Invoice preview" className="w-full object-contain max-h-[200px]" />
        </div>
      )}

      {ocrData && (
        <Card className="border-0 shadow-lg shadow-primary/5 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              OCR Extracted Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Invoice #", value: ocrData.invoiceNumber },
                { label: "Date", value: ocrData.date },
                { label: "Vendor", value: ocrData.vendorName },
                { label: "Amount", value: `$${ocrData.amount.toLocaleString()}` },
                { label: "GST (18%)", value: `$${ocrData.gst.toLocaleString()}` },
                { label: "Total", value: `$${(ocrData.amount + ocrData.gst).toLocaleString()}` },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="font-medium">{f.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                View raw OCR text
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap font-mono text-muted-foreground">
                {ocrData.rawText}
              </pre>
            </details>

            <Button className="w-full gap-2" onClick={handleAnalyze} disabled={analyzed}>
              <ScanLine className="h-4 w-4" />
              {analyzed ? "Analysis Complete" : "Run Fraud Detection"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploadOCR;
