# Prompt for Antigravity — CodeIt CRM (Coursera Subscription Reseller)

## Project Overview
Build a single-tenant internal CRM web application called **CodeIt CRM** to manage the sale of Coursera subscription accounts. The app is used by a single admin (me) to manage customers, manage a private inventory of subscription accounts, track which accounts are sold vs. available, and track profit margins.

## Tech Stack (strict constraint)
- **Frontend:** React.js (Vite), functional components, hooks only. No other frontend framework.
- **Backend/DB/Auth:** Supabase only (Postgres, Supabase Auth, Supabase client JS SDK, Row Level Security).
- No other backend, no ORMs, no third-party auth providers, no additional paid services.

## Authentication
- **No public sign-up / registration screen.**
- Only a login form (email + password) using Supabase Auth's `signInWithPassword`.
- Admin users are created manually by me in the Supabase Dashboard (Authentication → Users). The app must never expose a way to create a new account.
- After login, redirect to the dashboard. Add a logout button.
- Protect all routes: if there's no active Supabase session, redirect to `/login`.
- Enable Row Level Security (RLS) on all tables; policies should only allow access to `authenticated` users (since there is only one role: admin).

## Design System — "Notion-like"
Recreate the visual language of Notion as closely as possible:
- **Layout:** Left sidebar (fixed, ~240px) with navigation icons + labels (Dashboard, Customers, Inventory/Accounts, Settings). Main content area with generous whitespace and a max-width container.
- **Typography:** Clean sans-serif (Inter or system-ui stack), normal weight body text, semi-bold headings, generous line-height.
- **Color palette:** Mostly white/off-white background (`#ffffff` / `#f7f6f3`), near-black text (`#37352f`), light gray borders (`#e9e9e7`), subtle hover states (`#f1f1ef`), one muted accent color (e.g. soft blue) for primary actions/status badges.
- **Components:**
  - Rounded corners (6–8px), soft 1px borders instead of heavy shadows.
  - Notion-style tables with inline-editable cells where possible (click a cell to edit).
  - Status shown as small colored "pill" badges (e.g. green = Delivered, yellow = Pending, red = Cancelled, gray = Available, blue = Sold).
  - Slide-over side panel or modal (not full navigation) for "Add/Edit Customer" and "Add/Edit Account" forms, similar to Notion's page peek.
  - Minimal icons (use `lucide-react`), no heavy illustrations.
  - Empty states styled like Notion ("No customers yet" with a subtle icon and a "+ Add customer" button).
- Fully responsive (usable on mobile/tablet), but optimized primarily for desktop use.

## Core Data Model (Supabase / Postgres)

### 1. `settings` table
Stores configurable pricing so prices are never hardcoded.
- `id` (uuid, pk)
- `plan_type` (text, unique) — e.g. `'1_month'`, `'3_month'`
- `default_sale_price` (numeric) — e.g. 3500, 4500 (DZD)
- `default_cost_price` (numeric) — what I pay to acquire the account
- `updated_at` (timestamp)

Provide a Settings page where I can edit these values (sale price & cost price per plan type), and these become the defaults auto-filled when creating a new sale — but still overridable per individual sale.

### 2. `accounts` table (subscription inventory)
Represents each individual Coursera account/subscription I own.
- `id` (uuid, pk)
- `account_email` (text) — the Coursera login email for that account
- `account_password` (text) — stored securely, only visible to admin
- `plan_type` (text) — `'1_month'` or `'3_month'`
- `cost_price` (numeric) — actual price I paid for this specific account
- `status` (text) — `'available'` | `'sold'` | `'expired'`/`'disabled'` (enum-like, via check constraint)
- `created_at` (timestamp)
- `sold_at` (timestamp, nullable)

This is the key inventory table — the UI must make it visually obvious (colored badges/filters) which accounts are `available` vs `sold`, to avoid ever double-selling an account.

### 3. `customers` table
- `id` (uuid, pk)
- `full_name` (text)
- `phone` (text)
- `email` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamp)

Full CRUD required: Add, Edit, Delete customers from the UI (with a confirm dialog before delete).

### 4. `orders` table (the link between a customer, an account, and money)
- `id` (uuid, pk)
- `customer_id` (fk → customers.id)
- `account_id` (fk → accounts.id, nullable — null if order cancelled before assigning an account)
- `plan_type` (text)
- `sale_price` (numeric) — actual price charged to this customer (defaults from settings, editable)
- `cost_price` (numeric) — copied from the account's cost_price at time of sale (for historical accuracy even if settings change later)
- `profit` (numeric, generated or computed as `sale_price - cost_price`)
- `order_status` (text) — `'delivered'` | `'pending'` | `'cancelled'` (this is the status you asked for: has the account been delivered to the customer, is it still pending, or was the order cancelled)
- `created_at` (timestamp)
- `delivered_at` (timestamp, nullable)

**Business logic:**
- When a new order is created and marked with an assigned account → that account's `status` flips to `sold` and `sold_at` is set.
- If an order is later marked `cancelled` → the linked account (if any) should flip back to `available` automatically, and `account_id` can be cleared or kept for history (prefer: keep `account_id` for audit trail, but also revert account status to `available`; handle via a Postgres function/trigger or explicit client-side transaction).
- Profit should be visible per order and aggregated (total profit, profit by plan type, profit by month) on the Dashboard.

## Required Pages/Screens

1. **Login** — email/password form only, no signup link anywhere.
2. **Dashboard** — key stats: total customers, available accounts count, sold accounts count, total profit, profit this month, recent orders list.
3. **Customers** — table/list of all customers with search, columns: name, phone, email, number of orders, last order status. Actions: Add, Edit, Delete. Clicking a customer opens a detail panel showing their order history.
4. **Accounts (Inventory)** — table of all Coursera accounts with filters by status (`available` / `sold` / `expired`) and plan_type. Actions: Add new account (bulk-add option is a plus — e.g. paste multiple email:password lines at once), Edit, Delete/Disable.
5. **Orders / Sales** — table of all orders with filters by `order_status`. Create a new order flow: pick/search customer (or create inline), pick plan_type, system auto-suggests the next `available` account of that plan type + the default sale price from settings, admin can override price, set `order_status`. Editing an order lets me change its status (delivered / pending / cancelled) which triggers the account status logic above.
6. **Settings** — edit default sale price & cost price per plan_type (`1_month`, `3_month`), and allow adding new plan types in the future (don't hardcode only two plans in the schema/UI — make plan_type dynamic/extendable).

## Non-functional Requirements
- Use Supabase client SDK (`@supabase/supabase-js`) with environment variables for the URL/anon key.
- Use React Router for navigation between pages.
- Form validation (required fields, phone/email format) with inline error messages, Notion-style (small red text under the field, not intrusive alerts).
- Toast/snackbar notifications for success/error actions (e.g. "Customer added", "Order marked as delivered").
- Loading and empty states for every list/table.
- Code should be organized cleanly: `/components`, `/pages`, `/lib/supabaseClient.js`, `/hooks`.

## Deliverable
Generate the full project: Supabase SQL schema (tables, RLS policies, and a trigger/function to auto-update account status on order status change), and the complete React app implementing everything above with the Notion-inspired design system.
