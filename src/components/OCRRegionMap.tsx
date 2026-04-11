import { Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OCRRegion } from "@/lib/ocrEngine";

interface Props {
  regions: OCRRegion[];
  showOverlay?: boolean;
}

function confidenceColor(c: number) {
  if (c >= 90) return "text-safe";
  if (c >= 75) return "text-warning";
  return "text-danger";
}

function confidenceBg(c: number) {
  if (c >= 90) return "bg-safe/10";
  if (c >= 75) return "bg-warning/10";
  return "bg-danger/10";
}

const OCRRegionMap = ({ regions, showOverlay = true }: Props) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Crosshair className="h-3.5 w-3.5" />
      Extracted Regions
    </p>

    {/* Visual bounding-box overlay */}
    {showOverlay && (
      <div className="relative w-full aspect-[8.5/11] rounded-lg border bg-muted/30 overflow-hidden">
        {/* Simulated document background lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-[10%] h-px bg-muted-foreground/10"
            style={{
              top: `${5 + i * 4.5}%`,
              width: `${40 + Math.random() * 40}%`,
            }}
          />
        ))}

        {regions.map((r, i) => (
          <div
            key={i}
            className={`absolute border-2 rounded-sm flex items-end justify-start ${
              r.confidence >= 90
                ? "border-safe/60 bg-safe/5"
                : r.confidence >= 75
                ? "border-warning/60 bg-warning/5"
                : "border-danger/60 bg-danger/5"
            }`}
            style={{
              left: `${r.boundingBox.x * 100}%`,
              top: `${r.boundingBox.y * 100}%`,
              width: `${r.boundingBox.w * 100}%`,
              height: `${r.boundingBox.h * 100}%`,
            }}
          >
            <span className="text-[9px] font-semibold px-1 leading-tight bg-background/80 rounded-sm">
              {r.label}
            </span>
          </div>
        ))}
      </div>
    )}

    {/* Detail list */}
    <div className="grid gap-1.5">
      {regions.map((r, i) => (
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
  </div>
);

export default OCRRegionMap;
