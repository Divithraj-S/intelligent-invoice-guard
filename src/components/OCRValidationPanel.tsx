import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ValidationCheck } from "@/lib/ocrEngine";

interface Props {
  validations: ValidationCheck[];
}

const OCRValidationPanel = ({ validations }: Props) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Validation Checks
    </p>
    <div className="space-y-1.5">
      {validations.map((v, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-lg p-2.5 text-sm ${
            v.passed
              ? "bg-safe/10 text-safe-foreground"
              : "bg-danger/10 text-danger-foreground"
          }`}
        >
          {v.passed ? (
            <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-xs">{v.rule}</p>
            <p className="text-xs text-muted-foreground">{v.message}</p>
          </div>
          <Badge
            variant={v.passed ? "secondary" : "destructive"}
            className="ml-auto shrink-0 text-[10px]"
          >
            {v.passed ? "PASS" : "FAIL"}
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

export default OCRValidationPanel;
