
-- Drop permissive public policies
DROP POLICY IF EXISTS "Anyone can insert analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Anyone can view analysis history" ON public.analysis_history;

-- Restrict to authenticated users
CREATE POLICY "Authenticated users can insert analysis history"
ON public.analysis_history FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view analysis history"
ON public.analysis_history FOR SELECT TO authenticated
USING (true);
