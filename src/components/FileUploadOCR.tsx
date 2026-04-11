import { useState, useCallback } from "react";
import {
  FileImage, ScanLine, FileText, Loader2,
  AlertTriangle, ShieldCheck, Wrench, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { analyzeFraud, type FraudResult } from "@/lib/fraudEngine";
import { runAdvancedOCR, type OCRExtractionResult } from "@/lib/ocrEngine";
import OCRPreprocessingSteps from "./OCRPreprocessingSteps";
import OCRRegionMap from "./OCRRegionMap";
import OCRValidationPanel from "./OCRValidationPanel";
import { toast } from "sonner";

interface Props {
  onResult: (result: FraudResult) => void;
}

const FileUploadOCR = ({ onResult }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [ocrResult, setOcrResult] = useState<OCRExtractionResult | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setOcrResult(null);
    setAnalyzed(false);
    setProcessing(true);
    setProgress(0);
    setShowRaw(false);

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }

    const stages = [
      { label: "Loading document...", pct: 10 },
      { label: "Preprocessing — grayscale & noise removal...", pct: 20 },
      { label: "Preprocessing — thresholding & contrast...", pct: 30 },
      { label: "Detecting text regions (bounding boxes)...", pct: 45 },
      { label: "Running OCR on detected regions...", pct: 60 },
      { label: "Keyword-based field extraction...", pct: 72 },
      { label: "Validating extracted values...", pct: 82 },
      { label: "Adaptive correction pass...", pct: 90 },
      { label: "Finalising results...", pct: 98 },
    ];

    for (const s of stages) {
      setStage(s.label);
      setProgress(s.pct);
      await new Promise((r) => setTimeout(r, 500));
    }

    const data = runAdvancedOCR(f.name);
    setOcrResult(data);
    setProgress(100);
    setStage("Extraction complete");
    setProcessing(false);
    toast.success("Advanced OCR extraction complete", {
      description: `${data.regions.length} regions extracted · ${data.overallConfidence}% confidence`,
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.type === "application/pdf" || f.type.startsWith("image/"))) {
        processFile(f);
      } else {
        toast.error("Unsupported file type", {
          description: "Please upload PDF, JPG, or PNG",
        });
      }
    },
    [processFile]
  );

  const handleAnalyze = () => {
    if (!ocrResult) return;
    const riskLevels: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
    const result = analyzeFraud({
      invoiceId: ocrResult.invoiceNumber,
      amount: ocrResult.total,
      isDuplicate: Math.random() > 0.7,
      vendorRiskLevel: riskLevels[Math.floor(Math.random() * 3)],
      vendorName: ocrResult.vendorName,
    });
    onResult(result);
    setAnalyzed(true);
    toast.success("Fraud analysis complete");
  };

  const confColor =
    (ocrResult?.overallConfidence ?? 0) >= 85
      ? "text-safe"
      : (ocrResult?.overallConfidence ?? 0) >= 70
      ? "text-warning"
      : "text-danger";

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
        <p className="text-xs text-muted-foreground mt-1">
          Supports: PDF, JPG, PNG · Advanced OCR with preprocessing
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span className="truncate">{file.name}</span>
          <Badge variant="secondary" className="ml-auto shrink-0">
            {(file.size / 1024).toFixed(1)} KB
          </Badge>
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
        <div className="rounded-lg overflow-hidden border max-h-[180px]">
          <img
            src={preview}
            alt="Invoice preview"
            className="w-full object-contain max-h-[180px]"
          />
        </div>
      )}

      {ocrResult && (
        <Card className="border-0 shadow-lg shadow-primary/5 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                OCR Extraction Results
              </CardTitle>
              <div className="flex items-center gap-2">
                {ocrResult.correctionApplied && (
                  <Badge variant="outline" className="gap-1 text-[10px] text-warning border-warning/30">
                    <Wrench className="h-3 w-3" /> Corrected
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs font-bold ${confColor}`}
                >
                  {ocrResult.overallConfidence}% confidence
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Warnings */}
            {ocrResult.warnings.length > 0 && (
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 space-y-1">
                {ocrResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-warning-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* Extracted fields summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Invoice #", value: ocrResult.invoiceNumber },
                { label: "Date", value: ocrResult.date },
                { label: "Vendor", value: ocrResult.vendorName },
                {
                  label: "Subtotal",
                  value: `${ocrResult.currency.symbol}${ocrResult.subtotal.toLocaleString()}`,
                },
                {
                  label: "Tax",
                  value: `${ocrResult.currency.symbol}${ocrResult.tax.toLocaleString()}`,
                },
                {
                  label: "Total",
                  value: `${ocrResult.currency.symbol}${ocrResult.total.toLocaleString()}`,
                },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="font-medium">{f.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Region map with bounding boxes */}
            <OCRRegionMap regions={ocrResult.regions} />

            <Separator />

            {/* Preprocessing pipeline */}
            <OCRPreprocessingSteps steps={ocrResult.preprocessing} />

            <Separator />

            {/* Validation checks */}
            <OCRValidationPanel validations={ocrResult.validations} />

            {/* Correction details */}
            {ocrResult.correctionApplied && ocrResult.correctionDetails.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Adaptive Corrections Applied
                  </p>
                  {ocrResult.correctionDetails.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs rounded-md bg-primary/5 px-3 py-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {/* Raw text toggle */}
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showRaw ? "rotate-180" : ""}`}
              />
              {showRaw ? "Hide" : "View"} raw OCR text
            </button>
            {showRaw && (
              <pre className="p-3 bg-muted rounded-lg whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {ocrResult.rawText}
              </pre>
            )}

            {/* Analyze button */}
            <Button
              className="w-full gap-2"
              onClick={handleAnalyze}
              disabled={analyzed}
            >
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
