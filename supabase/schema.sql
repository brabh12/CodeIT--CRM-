-- ==========================================
-- CodeIt CRM - Supabase Database Schema
-- Multi-Service Support (Coursera, CapCut & Future Services)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. SERVICES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------
-- 2. SUBSCRIPTION PLANS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    default_sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    default_cost_price NUMERIC(10, 2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_service_plan_type UNIQUE (service_id, plan_type)
);

-- ------------------------------------------
-- 3. CUSTOMERS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------
-- 4. ACCOUNTS TABLE (Subscription Inventory)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    account_email TEXT NOT NULL,
    account_password TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at TIMESTAMPTZ NULL
);

-- ------------------------------------------
-- 5. ORDERS TABLE (Sales)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    account_id UUID NULL REFERENCES public.accounts(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    plan_type TEXT NOT NULL,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(10, 2) GENERATED ALWAYS AS (sale_price - cost_price) STORED,
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('delivered', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ NULL
);

-- ------------------------------------------
-- 6. LEGACY SETTINGS TABLE (Backwards Compatibility)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type TEXT NOT NULL UNIQUE,
    default_sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    default_cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------
-- 7. LEADS TABLE (Public Submissions e.g. CapCut)
-- ------------------------------------------
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

-- ------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_service ON public.subscription_plans(service_id);
CREATE INDEX IF NOT EXISTS idx_accounts_service_id ON public.accounts(service_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_id ON public.accounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_status ON public.accounts(plan_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON public.orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_plan_id ON public.orders(plan_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON public.orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_leads_service_status ON public.leads(service, status);

-- ------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Authenticated Access Only
-- ------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon / public
REVOKE ALL ON public.services FROM anon, public;
REVOKE ALL ON public.subscription_plans FROM anon, public;
REVOKE ALL ON public.settings FROM anon, public;
REVOKE ALL ON public.accounts FROM anon, public;
REVOKE ALL ON public.customers FROM anon, public;
REVOKE ALL ON public.orders FROM anon, public;
REVOKE ALL ON public.leads FROM anon, public;

-- Leads Policies: public anon can INSERT ONLY; authenticated can do ALL
CREATE POLICY "public_anon_insert_only_leads" 
    ON public.leads FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "authenticated_admin_all_leads" 
    ON public.leads FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Services Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_services_all" 
    ON public.services FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Subscription Plans Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_plans_all" 
    ON public.subscription_plans FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Accounts Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_accounts_all" 
    ON public.accounts FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Customers Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_customers_all" 
    ON public.customers FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Orders Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_orders_all" 
    ON public.orders FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- Legacy Settings Policies (Authenticated Users Only)
CREATE POLICY "authenticated_admin_settings_all" 
    ON public.settings FOR ALL 
    TO authenticated 
    USING (true) WITH CHECK (true);

-- ------------------------------------------
-- POSTGRES TRIGGER LOGIC FOR ACCOUNT STATUS
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_order_account_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.account_id IS NOT NULL AND OLD.account_id IS DISTINCT FROM NEW.account_id) OR
           (NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' AND OLD.account_id IS NOT NULL) THEN
            UPDATE public.accounts
            SET status = 'available',
                sold_at = NULL
            WHERE id = OLD.account_id;
        END IF;
    END IF;

    IF (NEW.order_status IN ('delivered', 'pending') AND NEW.account_id IS NOT NULL) THEN
        UPDATE public.accounts
        SET status = 'sold',
            sold_at = COALESCE(sold_at, NOW())
        WHERE id = NEW.account_id;
        
        IF (NEW.order_status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.order_status != 'delivered')) THEN
            NEW.delivered_at := NOW();
        END IF;
    END IF;

    IF (NEW.order_status = 'cancelled' AND NEW.account_id IS NOT NULL) THEN
        UPDATE public.accounts
        SET status = 'available',
            sold_at = NULL
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_order_account_status ON public.orders;
CREATE TRIGGER trigger_handle_order_account_status
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_account_status();

-- ------------------------------------------
-- SEED DATA
-- ------------------------------------------
DO $$
DECLARE
    coursera_id UUID;
    capcut_id UUID;
BEGIN
    -- Upsert Coursera Service
    INSERT INTO public.services (name, slug, is_active)
    VALUES ('Coursera', 'coursera', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active
    RETURNING id INTO coursera_id;

    -- Upsert CapCut Service
    INSERT INTO public.services (name, slug, is_active)
    VALUES ('CapCut', 'capcut', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active
    RETURNING id INTO capcut_id;

    -- Upsert Coursera Plans
    INSERT INTO public.subscription_plans (service_id, name, plan_type, default_sale_price, default_cost_price)
    VALUES 
        (coursera_id, '1-Month', '1_month', 3500.00, 2000.00),
        (coursera_id, '3-Month', '3_month', 4500.00, 2500.00)
    ON CONFLICT (service_id, plan_type) DO UPDATE
    SET name = EXCLUDED.name,
        default_sale_price = EXCLUDED.default_sale_price,
        default_cost_price = EXCLUDED.default_cost_price,
        updated_at = NOW();

    -- Upsert CapCut Plan
    INSERT INTO public.subscription_plans (service_id, name, plan_type, default_sale_price, default_cost_price)
    VALUES 
        (capcut_id, '1-Month', '1_month', 600.00, NULL)
    ON CONFLICT (service_id, plan_type) DO UPDATE
    SET name = EXCLUDED.name,
        default_sale_price = EXCLUDED.default_sale_price,
        updated_at = NOW();

    -- Legacy settings sync
    INSERT INTO public.settings (plan_type, default_sale_price, default_cost_price)
    VALUES 
        ('1_month', 3500.00, 2000.00),
        ('3_month', 4500.00, 2500.00)
    ON CONFLICT (plan_type) DO NOTHING;
END $$;
