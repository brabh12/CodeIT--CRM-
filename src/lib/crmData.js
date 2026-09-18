// =========================================================
// CRM Data Service & Multi-Service Store (Coursera & CapCut)
// Handles Supabase queries with robust local sync/fallback
// =========================================================
import { supabase } from './supabase';

const INITIAL_SERVICES = [
  { id: 'svc-coursera', name: 'Coursera', slug: 'coursera', is_active: true },
  { id: 'svc-capcut', name: 'CapCut', slug: 'capcut', is_active: true }
];

const INITIAL_PLANS = [
  { id: 'plan-coursera-1m', service_id: 'svc-coursera', name: '1-Month', plan_type: '1_month', default_sale_price: 3500, default_cost_price: 2000 },
  { id: 'plan-coursera-3m', service_id: 'svc-coursera', name: '3-Month', plan_type: '3_month', default_sale_price: 4500, default_cost_price: 2500 },
  { id: 'plan-capcut-1m', service_id: 'svc-capcut', name: '1-Month', plan_type: '1_month', default_sale_price: 600, default_cost_price: 200 }
];

const INITIAL_ACCOUNTS = [
  {
    id: 'acc-coursera-1',
    service_id: 'svc-coursera',
    plan_id: 'plan-coursera-1m',
    plan_type: '1_month',
    account_email: 'coursera.user1@codeit.dz',
    account_password: 'Pass123!Coursera',
    cost_price: 2000,
    status: 'available',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'acc-coursera-2',
    service_id: 'svc-coursera',
    plan_id: 'plan-coursera-3m',
    plan_type: '3_month',
    account_email: 'coursera.user2@codeit.dz',
    account_password: 'Pass456!Coursera',
    cost_price: 2500,
    status: 'sold',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'acc-capcut-1',
    service_id: 'svc-capcut',
    plan_id: 'plan-capcut-1m',
    plan_type: '1_month',
    account_email: 'capcut.pro1@codeit.dz',
    account_password: 'CapCutSecret2026',
    cost_price: 200,
    status: 'available',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'acc-capcut-2',
    service_id: 'svc-capcut',
    plan_id: 'plan-capcut-1m',
    plan_type: '1_month',
    account_email: 'capcut.pro2@codeit.dz',
    account_password: 'CapCutSecret999',
    cost_price: 200,
    status: 'available',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    full_name: 'Karim Ahmed',
    phone: '0550123456',
    email: 'karim@gmail.com',
    notes: 'Coursera client',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

const INITIAL_ORDERS = [
  {
    id: 'ord-1',
    customer_id: 'cust-1',
    account_id: 'acc-coursera-2',
    service_id: 'svc-coursera',
    plan_id: 'plan-coursera-3m',
    plan_type: '3_month',
    sale_price: 4500,
    cost_price: 2500,
    profit: 2000,
    order_status: 'delivered',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Helper to get / set from localStorage
function getLocal(key, defaultVal) {
  try {
    const raw = localStorage.getItem(`codeit_crm_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(`codeit_crm_${key}`, JSON.stringify(val));
  } catch (e) {
    // ignore
  }
}

// =========================================================
// SERVICES API
// =========================================================
export async function getCrmServices() {
  try {
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (!error && data && data.length > 0) {
      setLocal('services', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('services', INITIAL_SERVICES);
}

// =========================================================
// PLANS API
// =========================================================
export async function getCrmPlans() {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*, service:services(*)')
      .order('default_sale_price');
    
    if (!error && data && data.length > 0) {
      setLocal('plans', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('plans', INITIAL_PLANS);
}

export async function saveCrmPlan(planData) {
  let plans = await getCrmPlans();
  if (planData.id) {
    // Update
    try {
      await supabase.from('subscription_plans').update(planData).eq('id', planData.id);
    } catch (e) {}
    plans = plans.map(p => p.id === planData.id ? { ...p, ...planData } : p);
  } else {
    // Insert
    const newId = `plan-${Date.now()}`;
    const newPlan = { ...planData, id: newId };
    try {
      const { data } = await supabase.from('subscription_plans').insert([planData]).select().single();
      if (data) newPlan.id = data.id;
    } catch (e) {}
    plans = [...plans, newPlan];
  }
  setLocal('plans', plans);
  return plans;
}

// =========================================================
// LEADS API (Incoming Public Web Orders)
// =========================================================
export async function getCrmLeads() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setLocal('leads', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('leads', []);
}

export async function submitPublicLead(leadPayload) {
  const newLead = {
    id: `lead-${Date.now()}`,
    service: leadPayload.service || 'capcut',
    full_name: leadPayload.full_name,
    phone: leadPayload.phone,
    email: leadPayload.email,
    payment_method: leadPayload.payment_method,
    notes: leadPayload.notes || null,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Try Supabase insert
  try {
    const { data, error } = await supabase.from('leads').insert([leadPayload]).select().single();
    if (data) newLead.id = data.id;
  } catch (err) {
    console.warn('Supabase offline, using local lead sync:', err);
  }

  // Always keep in local store so it appears instantly in CRM
  const currentLeads = getLocal('leads', []);
  const updatedLeads = [newLead, ...currentLeads];
  setLocal('leads', updatedLeads);
  return newLead;
}

export async function updateLeadStatus(leadId, newStatus) {
  try {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
  } catch (e) {}

  const leads = getLocal('leads', []);
  const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
  setLocal('leads', updated);
  return updated;
}

// =========================================================
// ACCOUNTS API (Inventory)
// =========================================================
export async function getCrmAccounts() {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, service:services(*), plan:subscription_plans(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      setLocal('accounts', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('accounts', INITIAL_ACCOUNTS);
}

export async function saveCrmAccount(accountData) {
  let accounts = await getCrmAccounts();
  if (accountData.id) {
    try {
      await supabase.from('accounts').update(accountData).eq('id', accountData.id);
    } catch (e) {}
    accounts = accounts.map(a => a.id === accountData.id ? { ...a, ...accountData } : a);
  } else {
    const newId = `acc-${Date.now()}`;
    const newAccount = { ...accountData, id: newId, created_at: new Date().toISOString() };
    try {
      const { data } = await supabase.from('accounts').insert([accountData]).select().single();
      if (data) newAccount.id = data.id;
    } catch (e) {}
    accounts = [newAccount, ...accounts];
  }
  setLocal('accounts', accounts);
  return accounts;
}

export async function bulkAddCrmAccounts(accountList) {
  let currentAccounts = await getCrmAccounts();
  const createdNow = new Date().toISOString();
  const newItems = accountList.map((acc, idx) => ({
    ...acc,
    id: `acc-${Date.now()}-${idx}`,
    created_at: createdNow
  }));

  try {
    await supabase.from('accounts').insert(accountList);
  } catch (e) {}

  currentAccounts = [...newItems, ...currentAccounts];
  setLocal('accounts', currentAccounts);
  return currentAccounts;
}

export async function deleteCrmAccount(accountId) {
  try {
    await supabase.from('accounts').delete().eq('id', accountId);
  } catch (e) {}
  const accounts = (await getCrmAccounts()).filter(a => a.id !== accountId);
  setLocal('accounts', accounts);
  return accounts;
}

// =========================================================
// ORDERS API (Sales)
// =========================================================
export async function getCrmOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        account:accounts(*),
        service:services(*),
        plan:subscription_plans(*)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      setLocal('orders', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('orders', INITIAL_ORDERS);
}

export async function saveCrmOrder(orderData) {
  let orders = await getCrmOrders();
  let accounts = await getCrmAccounts();

  if (orderData.id) {
    try {
      await supabase.from('orders').update(orderData).eq('id', orderData.id);
    } catch (e) {}
    orders = orders.map(o => o.id === orderData.id ? { ...o, ...orderData } : o);
  } else {
    const newId = `ord-${Date.now()}`;
    const newOrder = {
      ...orderData,
      id: newId,
      created_at: new Date().toISOString(),
      profit: (parseFloat(orderData.sale_price) || 0) - (parseFloat(orderData.cost_price) || 0)
    };
    try {
      const { data } = await supabase.from('orders').insert([orderData]).select().single();
      if (data) newOrder.id = data.id;
    } catch (e) {}
    orders = [newOrder, ...orders];
  }

  // Handle account status
  if (orderData.account_id && orderData.order_status !== 'cancelled') {
    accounts = accounts.map(a => a.id === orderData.account_id ? { ...a, status: 'sold', sold_at: new Date().toISOString() } : a);
    setLocal('accounts', accounts);
    try {
      await supabase.from('accounts').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', orderData.account_id);
    } catch (e) {}
  } else if (orderData.account_id && orderData.order_status === 'cancelled') {
    accounts = accounts.map(a => a.id === orderData.account_id ? { ...a, status: 'available', sold_at: null } : a);
    setLocal('accounts', accounts);
    try {
      await supabase.from('accounts').update({ status: 'available', sold_at: null }).eq('id', orderData.account_id);
    } catch (e) {}
  }

  setLocal('orders', orders);
  return orders;
}

export async function deleteCrmOrder(orderId) {
  try {
    await supabase.from('orders').delete().eq('id', orderId);
  } catch (e) {}
  const orders = (await getCrmOrders()).filter(o => o.id !== orderId);
  setLocal('orders', orders);
  return orders;
}

// =========================================================
// CUSTOMERS API
// =========================================================
export async function getCrmCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(*)')
      .order('full_name');
    
    if (!error && data && data.length > 0) {
      setLocal('customers', data);
      return data;
    }
  } catch (err) {
    // fallback
  }
  return getLocal('customers', INITIAL_CUSTOMERS);
}

export async function saveCrmCustomer(custData) {
  let customers = await getCrmCustomers();
  if (custData.id) {
    try {
      await supabase.from('customers').update(custData).eq('id', custData.id);
    } catch (e) {}
    customers = customers.map(c => c.id === custData.id ? { ...c, ...custData } : c);
  } else {
    const newId = `cust-${Date.now()}`;
    const newCust = { ...custData, id: newId, created_at: new Date().toISOString() };
    try {
      const { data } = await supabase.from('customers').insert([custData]).select().single();
      if (data) newCust.id = data.id;
    } catch (e) {}
    customers = [newCust, ...customers];
  }
  setLocal('customers', customers);
  return customers;
}
