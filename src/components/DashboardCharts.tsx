import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChartIcon } from "lucide-react";
import type { FraudResult } from "@/lib/fraudEngine";

interface Props {
  history: FraudResult[];
}

const COLORS = {
  low: "hsl(142, 71%, 45%)",
  medium: "hsl(38, 92%, 50%)",
  high: "hsl(0, 84%, 60%)",
};

const DashboardCharts = ({ history }: Props) => {
  if (history.length < 2) return null;

  const low = history.filter((r) => r.riskLevel === "low").length;
  const medium = history.filter((r) => r.riskLevel === "medium").length;
  const high = history.filter((r) => r.riskLevel === "high").length;

  const pieData = [
    { name: "Low Risk", value: low, color: COLORS.low },
    { name: "Medium Risk", value: medium, color: COLORS.medium },
    { name: "High Risk", value: high, color: COLORS.high },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Approved", count: low, fill: COLORS.low },
    { name: "Review", count: medium, fill: COLORS.medium },
    { name: "Fraud Alert", count: high, fill: COLORS.high },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Decision Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
