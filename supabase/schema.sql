-- ==========================================
-- CodeIt CRM - Supabase Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. SETTINGS TABLE
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
-- 2. ACCOUNTS TABLE (Subscription Inventory)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_email TEXT NOT NULL,
    account_password TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at TIMESTAMPTZ NULL
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
-- 4. ORDERS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    account_id UUID NULL REFERENCES public.accounts(id) ON DELETE SET NULL,
    plan_type TEXT NOT NULL,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(10, 2) GENERATED ALWAYS AS (sale_price - cost_price) STORED,
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('delivered', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ NULL
);

-- ------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accounts_plan_status ON public.accounts(plan_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON public.orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);

-- ------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Settings Policies (Authenticated Users Only)
CREATE POLICY "Allow authenticated read/write on settings" 
    ON public.settings FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Accounts Policies (Authenticated Users Only)
CREATE POLICY "Allow authenticated read/write on accounts" 
    ON public.accounts FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Customers Policies (Authenticated Users Only)
CREATE POLICY "Allow authenticated read/write on customers" 
    ON public.customers FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Orders Policies (Authenticated Users Only)
CREATE POLICY "Allow authenticated read/write on orders" 
    ON public.orders FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- ------------------------------------------
-- POSTGRES TRIGGER LOGIC FOR ACCOUNT STATUS
-- ------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_order_account_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. If an old order had an assigned account, and the order is either cancelled or account changed:
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.account_id IS NOT NULL AND OLD.account_id IS DISTINCT FROM NEW.account_id) OR
           (NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' AND OLD.account_id IS NOT NULL) THEN
            UPDATE public.accounts
            SET status = 'available',
                sold_at = NULL
            WHERE id = OLD.account_id;
        END IF;
    END IF;

    -- 2. If the order is active ('delivered' or 'pending') and has an assigned account:
    IF (NEW.order_status IN ('delivered', 'pending') AND NEW.account_id IS NOT NULL) THEN
        UPDATE public.accounts
        SET status = 'sold',
            sold_at = COALESCE(sold_at, NOW())
        WHERE id = NEW.account_id;
        
        -- Set delivered_at timestamp if status changed to delivered
        IF (NEW.order_status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.order_status != 'delivered')) THEN
            NEW.delivered_at := NOW();
        END IF;
    END IF;

    -- 3. If order was cancelled:
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
-- SEED DATA (DEFAULT PRICING PLAN SETTINGS)
-- Note: cost_price values are PLACEHOLDERS (editable in Settings UI)
-- ------------------------------------------
INSERT INTO public.settings (plan_type, default_sale_price, default_cost_price)
VALUES 
    ('1_month', 3500.00, 2000.00), -- 2000 DZD placeholder cost price
    ('3_month', 4500.00, 2500.00)  -- 2500 DZD placeholder cost price
ON CONFLICT (plan_type) DO UPDATE
SET default_sale_price = EXCLUDED.default_sale_price,
    default_cost_price = EXCLUDED.default_cost_price;



