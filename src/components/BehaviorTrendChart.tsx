import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { FraudResult } from "@/lib/fraudEngine";

interface Props {
  history: FraudResult[];
}

const BehaviorTrendChart = ({ history }: Props) => {
  if (history.length < 3) return null;

  // Build trend data from history (most recent first, reverse for chart)
  const trendData = [...history]
    .reverse()
    .map((r, i) => ({
      index: i + 1,
      fraud: r.fraudProbability,
      anomaly: r.anomalyScore,
      confidence: r.confidenceScore,
      vendor: r.invoice.vendorName,
    }));

  return (
    <Card className="border-0 shadow-lg shadow-primary/5 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Fraud Score &amp; Anomaly Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: "Invoice #", position: "insideBottom", offset: -5, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-card p-2 shadow-md text-xs">
                    <p className="font-medium mb-1">{d.vendor}</p>
                    <p style={{ color: "hsl(0, 84%, 60%)" }}>Fraud: {d.fraud}%</p>
                    <p style={{ color: "hsl(38, 92%, 50%)" }}>Anomaly: {d.anomaly}%</p>
                    <p style={{ color: "hsl(221, 83%, 53%)" }}>Confidence: {d.confidence}%</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="fraud" stroke="hsl(0, 84%, 60%)" fill="url(#fraudGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="anomaly" stroke="hsl(38, 92%, 50%)" fill="url(#anomalyGrad)" strokeWidth={2} />
            <Line type="monotone" dataKey="confidence" stroke="hsl(221, 83%, 53%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-danger inline-block rounded" /> Fraud Score</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block rounded" /> Anomaly</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded border-dashed" /> Confidence</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BehaviorTrendChart;
