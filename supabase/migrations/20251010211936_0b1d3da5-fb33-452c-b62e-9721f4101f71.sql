-- Create optimization_suggestions table for AI-powered recommendations
CREATE TABLE public.optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('cost', 'performance', 'security', 'storage')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 100),
  potential_savings NUMERIC,
  potential_improvement TEXT,
  category TEXT NOT NULL,
  affected_service TEXT,
  recommendation TEXT NOT NULL,
  auto_applicable BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'applied', 'dismissed', 'in_progress')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_suggestions_status ON public.optimization_suggestions(status);
CREATE INDEX idx_suggestions_severity ON public.optimization_suggestions(severity);
CREATE INDEX idx_suggestions_type ON public.optimization_suggestions(suggestion_type);
CREATE INDEX idx_suggestions_score ON public.optimization_suggestions(impact_score DESC);
CREATE INDEX idx_suggestions_created ON public.optimization_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.optimization_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage optimization suggestions"
ON public.optimization_suggestions
FOR ALL
TO authenticated
USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_optimization_suggestions
BEFORE UPDATE ON public.optimization_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.optimization_suggestions;