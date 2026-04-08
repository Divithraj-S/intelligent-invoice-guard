import { ShieldCheck, ShieldAlert, AlertTriangle, Brain, CheckCircle2, XCircle, Info, ThumbsUp, ThumbsDown, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { FraudResult } from "@/lib/fraudEngine";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  result: FraudResult;
}

const riskConfig = {
  low: { icon: ShieldCheck, label: "Low Risk", color: "text-safe", bg: "bg-safe/10", border: "border-safe/20", badge: "bg-safe text-safe-foreground" },
  medium: { icon: AlertTriangle, label: "Medium Risk", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", badge: "bg-warning text-warning-foreground" },
  high: { icon: ShieldAlert, label: "High Risk", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", badge: "bg-danger text-danger-foreground" },
};

const FraudResultPanel = ({ result }: Props) => {
  const [feedback, setFeedback] = useState<"fraud" | "genuine" | null>(null);
  const config = riskConfig[result.riskLevel];
  const Icon = config.icon;

  const handleFeedback = (type: "fraud" | "genuine") => {
    setFeedback(type);
    toast.success(`Feedback recorded: marked as ${type}`, { description: "Thank you for improving the model." });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Main Result Card */}
      <Card className={`border-2 shadow-lg ${config.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              Analysis Result
            </CardTitle>
            <Badge className={config.badge}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Decision Banner */}
          <div className={`rounded-lg p-4 ${config.bg} text-center`}>
            <p className="text-sm font-medium text-muted-foreground">Decision</p>
            <p className={`text-2xl font-bold ${config.color}`}>{result.decision}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fraud Probability</span>
                <span className="font-semibold">{result.fraudProbability}%</span>
              </div>
              <Progress value={result.fraudProbability} className="h-2.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-semibold">{result.confidenceScore}%</span>
              </div>
              <Progress value={result.confidenceScore} className="h-2.5" />
            </div>
          </div>

          {/* Alert */}
          {result.alertSent && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm">
              <Bell className="h-4 w-4 text-danger" />
              <span className="text-danger font-medium">Email alert sent for high-risk invoice</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explainable AI */}
      <Card className="shadow-lg border-0 shadow-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            Explainable AI — Why this decision?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.explanations.map((exp, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>{exp}</span>
            </div>
          ))}

          <Separator className="my-3" />
          <p className="text-xs font-medium text-muted-foreground mb-2">Rule Validation Results</p>
          {result.ruleFlags.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.triggered ? (
                <XCircle className="h-4 w-4 text-danger shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
              )}
              <span className={r.triggered ? "text-danger" : "text-muted-foreground"}>{r.rule}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {r.triggered ? "Flagged" : "Passed"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="shadow-lg border-0 shadow-primary/5">
        <CardContent className="pt-5">
          <p className="text-sm font-medium mb-3">Was this classification correct?</p>
          <div className="flex gap-2">
            <Button
              variant={feedback === "genuine" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => handleFeedback("genuine")}
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Mark as Genuine
            </Button>
            <Button
              variant={feedback === "fraud" ? "destructive" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => handleFeedback("fraud")}
            >
              <ThumbsDown className="h-3.5 w-3.5" /> Mark as Fraud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FraudResultPanel;
