-- Create cost tracking tables for real-time cost estimation

-- Table to store service costs and pricing
CREATE TABLE IF NOT EXISTS public.service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  unit_type TEXT NOT NULL, -- 'storage_gb', 'api_calls', 'bandwidth_gb', 'edge_function_invocations'
  cost_per_unit DECIMAL(10, 6) NOT NULL,
  free_tier_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to track resource usage in real-time
CREATE TABLE IF NOT EXISTS public.resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  usage_amount DECIMAL(15, 2) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to store calculated costs
CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_usage DECIMAL(15, 2) NOT NULL,
  estimated_cost DECIMAL(10, 2) NOT NULL,
  actual_cost DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only)
CREATE POLICY "Admins can manage service pricing"
  ON public.service_pricing FOR ALL
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

CREATE POLICY "Admins can view resource usage"
  ON public.resource_usage FOR SELECT
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

CREATE POLICY "Admins can manage cost estimates"
  ON public.cost_estimates FOR ALL
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Function to calculate real-time costs
CREATE OR REPLACE FUNCTION public.calculate_current_month_costs()
RETURNS TABLE(
  service_name TEXT,
  total_usage DECIMAL,
  free_tier_used DECIMAL,
  billable_usage DECIMAL,
  estimated_cost DECIMAL
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_usage AS (
    SELECT 
      ru.service_name,
      SUM(ru.usage_amount) as total_usage
    FROM public.resource_usage ru
    WHERE ru.usage_date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY ru.service_name
  ),
  pricing AS (
    SELECT 
      sp.service_name,
      sp.free_tier_limit,
      sp.cost_per_unit
    FROM public.service_pricing sp
  )
  SELECT 
    COALESCE(mu.service_name, p.service_name) as service_name,
    COALESCE(mu.total_usage, 0) as total_usage,
    LEAST(COALESCE(mu.total_usage, 0), p.free_tier_limit) as free_tier_used,
    GREATEST(COALESCE(mu.total_usage, 0) - p.free_tier_limit, 0) as billable_usage,
    GREATEST(COALESCE(mu.total_usage, 0) - p.free_tier_limit, 0) * p.cost_per_unit as estimated_cost
  FROM pricing p
  LEFT JOIN monthly_usage mu ON p.service_name = mu.service_name;
END;
$$;

-- Insert default pricing (based on typical cloud costs)
INSERT INTO public.service_pricing (service_name, unit_type, cost_per_unit, free_tier_limit)
VALUES 
  ('Database Storage', 'storage_gb', 0.125, 500),
  ('API Calls', 'api_calls', 0.000002, 1000000),
  ('Bandwidth', 'bandwidth_gb', 0.09, 50),
  ('Edge Functions', 'edge_function_invocations', 0.000002, 500000),
  ('File Storage', 'storage_gb', 0.021, 1),
  ('Authentication', 'monthly_active_users', 0.00325, 10000)
ON CONFLICT (service_name) DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_cost_tracking_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_service_pricing_timestamp
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_cost_tracking_timestamp();

CREATE TRIGGER update_resource_usage_timestamp
  BEFORE UPDATE ON public.resource_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_cost_tracking_timestamp();

CREATE TRIGGER update_cost_estimates_timestamp
  BEFORE UPDATE ON public.cost_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_cost_tracking_timestamp();

-- Enable realtime for cost tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_estimates;