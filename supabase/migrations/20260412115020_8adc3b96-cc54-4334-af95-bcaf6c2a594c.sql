
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  vendor_risk_level TEXT NOT NULL,
  fraud_probability INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  decision TEXT NOT NULL,
  explanations JSONB NOT NULL DEFAULT '[]',
  rule_flags JSONB NOT NULL DEFAULT '[]',
  behavioral_insights JSONB NOT NULL DEFAULT '[]',
  anomaly_score INTEGER NOT NULL DEFAULT 0,
  vendor_risk_score INTEGER NOT NULL DEFAULT 0,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analysis history"
  ON public.analysis_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert analysis history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (true);
