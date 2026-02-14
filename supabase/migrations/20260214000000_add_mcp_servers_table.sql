-- Add table to store MCP server entries
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure updated_at helper exists before creating trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_mcp_servers_updated_at'
    ) THEN
      CREATE TRIGGER update_mcp_servers_updated_at
      BEFORE UPDATE ON public.mcp_servers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END$$;

-- Insert the configured supabase MCP server if not present
INSERT INTO public.mcp_servers (name, type, url, metadata)
SELECT 'supabase', 'http', 'https://mcp.supabase.com/mcp?project_ref=irlbqoxqgztgjezzwknm&features=docs%2Caccount%2Cdebugging%2Cdevelopment%2Cdatabase%2Cfunctions%2Cbranching%2Cstorage', jsonb_build_object('source', 'mcp-servers/servers.json')
WHERE NOT EXISTS (SELECT 1 FROM public.mcp_servers WHERE name = 'supabase');
