-- =========================================================
-- Migration: 01_multi_service.sql
-- Part 1: Generalize CRM for Multiple Services (Coursera, CapCut)
-- =========================================================

-- 1. Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Subscription Plans Table
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

-- 3. Add service_id and plan_id to accounts
ALTER TABLE public.accounts
    ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

-- 4. Add service_id and plan_id to orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

-- 5. Enable Row Level Security (RLS) & Configure Strict Policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon / public
REVOKE ALL ON public.services FROM anon, public;
REVOKE ALL ON public.subscription_plans FROM anon, public;
REVOKE ALL ON public.accounts FROM anon, public;
REVOKE ALL ON public.orders FROM anon, public;
REVOKE ALL ON public.customers FROM anon, public;
REVOKE ALL ON public.settings FROM anon, public;

-- Allow authenticated users only (admin)
DROP POLICY IF EXISTS "authenticated_admin_services_all" ON public.services;
CREATE POLICY "authenticated_admin_services_all" 
    ON public.services 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_admin_plans_all" ON public.subscription_plans;
CREATE POLICY "authenticated_admin_plans_all" 
    ON public.subscription_plans 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_admin_accounts_all" ON public.accounts;
CREATE POLICY "authenticated_admin_accounts_all" 
    ON public.accounts 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_admin_customers_all" ON public.customers;
CREATE POLICY "authenticated_admin_customers_all" 
    ON public.customers 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_admin_orders_all" ON public.orders;
CREATE POLICY "authenticated_admin_orders_all" 
    ON public.orders 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_admin_settings_all" ON public.settings;
CREATE POLICY "authenticated_admin_settings_all" 
    ON public.settings 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 6. Seed Data for Services & Plans
DO $$
DECLARE
    coursera_id UUID;
    capcut_id UUID;
    coursera_1m_cost NUMERIC(10, 2) := 2000.00;
    coursera_3m_cost NUMERIC(10, 2) := 2500.00;
    coursera_1m_sale NUMERIC(10, 2) := 3500.00;
    coursera_3m_sale NUMERIC(10, 2) := 4500.00;
BEGIN
    -- Pull existing settings if available to keep custom values
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        SELECT COALESCE(default_cost_price, 2000.00), COALESCE(default_sale_price, 3500.00)
        INTO coursera_1m_cost, coursera_1m_sale
        FROM public.settings WHERE plan_type = '1_month' LIMIT 1;

        SELECT COALESCE(default_cost_price, 2500.00), COALESCE(default_sale_price, 4500.00)
        INTO coursera_3m_cost, coursera_3m_sale
        FROM public.settings WHERE plan_type = '3_month' LIMIT 1;
    END IF;

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
        (coursera_id, '1-Month', '1_month', COALESCE(coursera_1m_sale, 3500.00), COALESCE(coursera_1m_cost, 2000.00)),
        (coursera_id, '3-Month', '3_month', COALESCE(coursera_3m_sale, 4500.00), COALESCE(coursera_3m_cost, 2500.00))
    ON CONFLICT (service_id, plan_type) DO UPDATE
    SET name = EXCLUDED.name,
        default_sale_price = EXCLUDED.default_sale_price,
        default_cost_price = EXCLUDED.default_cost_price,
        updated_at = NOW();

    -- Upsert CapCut Plan (600 DZD sale price, cost price null/blank for admin)
    INSERT INTO public.subscription_plans (service_id, name, plan_type, default_sale_price, default_cost_price)
    VALUES 
        (capcut_id, '1-Month', '1_month', 600.00, NULL)
    ON CONFLICT (service_id, plan_type) DO UPDATE
    SET name = EXCLUDED.name,
        default_sale_price = EXCLUDED.default_sale_price,
        updated_at = NOW();

    -- 7. Backfill Historical Accounts to Coursera
    UPDATE public.accounts a
    SET service_id = coursera_id,
        plan_id = sp.id
    FROM public.subscription_plans sp
    WHERE sp.service_id = coursera_id 
      AND sp.plan_type = a.plan_type
      AND (a.plan_id IS NULL OR a.service_id IS NULL);

    -- Fallback for any account with unknown plan_type to Coursera 1-Month
    UPDATE public.accounts a
    SET service_id = coursera_id,
        plan_id = (SELECT id FROM public.subscription_plans WHERE service_id = coursera_id AND plan_type = '1_month' LIMIT 1)
    WHERE a.plan_id IS NULL OR a.service_id IS NULL;

    -- 8. Backfill Historical Orders to Coursera
    UPDATE public.orders o
    SET service_id = coursera_id,
        plan_id = sp.id
    FROM public.subscription_plans sp
    WHERE sp.service_id = coursera_id 
      AND sp.plan_type = o.plan_type
      AND (o.plan_id IS NULL OR o.service_id IS NULL);

    -- Fallback for any order with unknown plan_type to Coursera 1-Month
    UPDATE public.orders o
    SET service_id = coursera_id,
        plan_id = (SELECT id FROM public.subscription_plans WHERE service_id = coursera_id AND plan_type = '1_month' LIMIT 1)
    WHERE o.plan_id IS NULL OR o.service_id IS NULL;

END $$;

-- 9. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_service ON public.subscription_plans(service_id);
CREATE INDEX IF NOT EXISTS idx_accounts_service_id ON public.accounts(service_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_id ON public.accounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON public.orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_plan_id ON public.orders(plan_id);

-- 10. Update Trigger for Account Status to Preserve Order-Account Consistency
CREATE OR REPLACE FUNCTION public.handle_order_account_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If account changed or order cancelled, revert old account
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.account_id IS NOT NULL AND OLD.account_id IS DISTINCT FROM NEW.account_id) OR
           (NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' AND OLD.account_id IS NOT NULL) THEN
            UPDATE public.accounts
            SET status = 'available',
                sold_at = NULL
            WHERE id = OLD.account_id;
        END IF;
    END IF;

    -- If order is delivered or pending, mark assigned account as sold
    IF (NEW.order_status IN ('delivered', 'pending') AND NEW.account_id IS NOT NULL) THEN
        UPDATE public.accounts
        SET status = 'sold',
            sold_at = COALESCE(sold_at, NOW())
        WHERE id = NEW.account_id;
        
        IF (NEW.order_status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.order_status != 'delivered')) THEN
            NEW.delivered_at := NOW();
        END IF;
    END IF;

    -- If order cancelled, revert account to available
    IF (NEW.order_status = 'cancelled' AND NEW.account_id IS NOT NULL) THEN
        UPDATE public.accounts
        SET status = 'available',
            sold_at = NULL
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
