-- Clients table for SEO Bandwagon client management
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  gsc_site_url TEXT,  -- The GSC property URL (e.g., sc-domain:example.com)
  ga4_property_id TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'churned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS clients_gsc_site_idx ON clients(gsc_site_url);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated service role
CREATE POLICY "Service role full access" ON clients
  FOR ALL USING (true);
