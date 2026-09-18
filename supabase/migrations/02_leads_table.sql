-- =========================================================
-- Migration: 02_leads_table.sql
-- Part 2: Public Leads Table for CapCut Orders with Strict RLS
-- =========================================================

-- 1. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service TEXT NOT NULL DEFAULT 'capcut',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    payment_method TEXT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for queries
CREATE INDEX IF NOT EXISTS idx_leads_service_status ON public.leads(service, status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 3. Strict Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon / public
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM public;

-- Allow anonymous public visitors to INSERT ONLY
DROP POLICY IF EXISTS "public_anon_insert_only_leads" ON public.leads;
CREATE POLICY "public_anon_insert_only_leads" 
    ON public.leads 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Allow authenticated admin users to have FULL ACCESS (Select, Insert, Update, Delete)
DROP POLICY IF EXISTS "authenticated_admin_all_leads" ON public.leads;
CREATE POLICY "authenticated_admin_all_leads" 
    ON public.leads 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
