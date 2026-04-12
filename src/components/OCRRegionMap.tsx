import { Crosshair, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OCRRegion } from "@/lib/ocrEngine";

interface Props {
  regions: OCRRegion[];
  showOverlay?: boolean;
  confidenceThreshold?: number;
}

const CONFIDENCE_THRESHOLD = 70;

function confidenceColor(c: number) {
  if (c >= 85) return "text-safe";
  if (c >= 70) return "text-warning";
  return "text-danger";
}

function confidenceBg(c: number) {
  if (c >= 85) return "bg-safe/10";
  if (c >= 70) return "bg-warning/10";
  return "bg-danger/10";
}

function borderClass(c: number) {
  if (c >= 85) return "border-safe/60 bg-safe/5";
  if (c >= 70) return "border-warning/60 bg-warning/5";
  return "border-danger/60 bg-danger/5";
}

function hasValidData(r: OCRRegion): boolean {
  if (r.extractedValue === null || r.extractedValue === undefined) return false;
  if (typeof r.extractedValue === "string" && r.extractedValue.trim() === "") return false;
  if (typeof r.extractedValue === "number" && (isNaN(r.extractedValue) || r.extractedValue === 0)) return false;
  return true;
}

const OCRRegionMap = ({ regions, showOverlay = true, confidenceThreshold = CONFIDENCE_THRESHOLD }: Props) => {
  const visibleRegions = regions.filter(
    (r) => r.confidence >= confidenceThreshold && hasValidData(r)
  );
  const hiddenRegions = regions.filter(
    (r) => r.confidence < confidenceThreshold || !hasValidData(r)
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Crosshair className="h-3.5 w-3.5" />
        Extracted Regions
        {visibleRegions.length < regions.length && (
          <Badge variant="secondary" className="text-[10px] ml-1">
            {visibleRegions.length}/{regions.length} detected
          </Badge>
        )}
      </p>


      {/* Detail list — visible regions */}
      {visibleRegions.length > 0 ? (
        <div className="grid gap-1.5">
          {visibleRegions.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${confidenceBg(r.confidence)}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs">{r.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.extractedText}
                </p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] ${confidenceColor(r.confidence)}`}>
                {r.confidence.toFixed(0)}%
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
          <EyeOff className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            No regions detected with sufficient confidence
          </p>
        </div>
      )}

      {/* Hidden / low-confidence fields */}
      {hiddenRegions.length > 0 && (
        <div className="space-y-1">
          {hiddenRegions.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground bg-muted/30"
            >
              <EyeOff className="h-3 w-3 shrink-0 opacity-50" />
              <span className="font-medium">{r.label}</span>
              <span className="ml-auto text-[10px]">
                Field not detected — low OCR confidence ({r.confidence.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OCRRegionMap;
