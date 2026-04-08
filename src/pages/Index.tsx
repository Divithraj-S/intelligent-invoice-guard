import { useState, useCallback } from "react";
import { Brain, Shield } from "lucide-react";
import InvoiceForm from "@/components/InvoiceForm";
import FraudResultPanel from "@/components/FraudResultPanel";
import InvoiceHistory from "@/components/InvoiceHistory";
import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts";
import { analyzeFraud, type InvoiceInput, type FraudResult } from "@/lib/fraudEngine";

const Index = () => {
  const [result, setResult] = useState<FraudResult | null>(null);
  const [history, setHistory] = useState<FraudResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = useCallback((input: InvoiceInput) => {
    setIsAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const res = analyzeFraud(input);
      setResult(res);
      setHistory((prev) => [res, ...prev]);
      setIsAnalyzing(false);
    }, 1500);
  }, []);

  const handleBulkResults = useCallback((results: FraudResult[]) => {
    setHistory((prev) => [...results, ...prev]);
    if (results.length > 0) setResult(results[0]);
  }, []);

  const handleFileResult = useCallback((res: FraudResult) => {
    setResult(res);
    setHistory((prev) => [res, ...prev]);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="gradient-bg text-primary-foreground">
        <div className="container py-8 md:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Intelligent Invoice Fraud Detection
              </h1>
              <p className="text-sm md:text-base opacity-80 flex items-center gap-1.5 mt-0.5">
                <Brain className="h-4 w-4" />
                ML + Rule-Based Analysis · CSV · PDF/Image OCR
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container -mt-6 relative z-10 mb-6">
        <DashboardStats history={history} />
      </div>

      <main className="container pb-12 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <InvoiceForm
              onAnalyze={handleAnalyze}
              onBulkResults={handleBulkResults}
              onFileResult={handleFileResult}
              isAnalyzing={isAnalyzing}
            />
          </div>
          <div>
            {result ? (
              <FraudResultPanel result={result} />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-muted p-12 text-center text-muted-foreground animate-fade-in">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No analysis yet</p>
                <p className="text-sm mt-1">Submit an invoice to see fraud detection results</p>
              </div>
            )}
          </div>
        </div>

        <DashboardCharts history={history} />

        <InvoiceHistory history={history} />
      </main>
    </div>
  );
};

export default Index;
