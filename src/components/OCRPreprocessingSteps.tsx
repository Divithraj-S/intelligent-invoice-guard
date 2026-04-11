import { Eye, Layers } from "lucide-react";
import type { PreprocessingStep } from "@/lib/ocrEngine";

interface Props {
  steps: PreprocessingStep[];
}

const OCRPreprocessingSteps = ({ steps }: Props) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Layers className="h-3.5 w-3.5" />
      Preprocessing Pipeline
    </p>
    <div className="grid gap-1.5">
      {steps.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs"
        >
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              !s.applied
                ? "bg-muted-foreground/30"
                : s.impact === "significant"
                ? "bg-safe"
                : s.impact === "minor"
                ? "bg-warning"
                : "bg-muted-foreground/30"
            }`}
          />
          <span className="font-medium">{s.name}</span>
          <span className="text-muted-foreground ml-auto truncate max-w-[55%] text-right">
            {s.description}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default OCRPreprocessingSteps;
