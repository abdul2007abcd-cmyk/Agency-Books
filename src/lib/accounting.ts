import { Transaction, formatCurrency } from './supabase';

/**
 * Standard Agency Accounting Engine
 * Separates Operating Expenses from Partner Equity Distributions (Draws).
 * Enforces business finance rule: Partner draws are NOT operating expenses.
 */

export function isPartnerDraw(t: { type: string; cat?: string; descr?: string }): boolean {
  if (t.type !== 'expense') return false;
  const c = (t.cat || '').toLowerCase();
  const d = (t.descr || '').toLowerCase();
  return (
    c.includes('partner draw') ||
    c.includes('profit share') ||
    c.includes('partner share') ||
    c.includes('owner draw') ||
    c.includes('equity draw') ||
    c.includes('dividend') ||
    d.includes('profit share') ||
    d.includes('partner draw')
  );
}

export function isOperatingExpense(t: { type: string; cat?: string; descr?: string }): boolean {
  return t.type === 'expense' && !isPartnerDraw(t);
}

export function isClientIncome(t: { type: string }): boolean {
  return t.type === 'income';
}

export interface AccountingSummary {
  // Profit & Loss Core (Operating Level)
  grossRevenue: number;         // Total settled client billing
  operatingExpenses: number;    // Business running expenses EXCLUDING partner draws
  netOperatingProfit: number;   // True agency business profit (EBITDA)
  operatingMarginPct: number;   // Profit margin %

  // Below the Line: Partner Equity & Distributions
  abdulDraws: number;           // Draws taken by Abdul
  punithDraws: number;          // Draws taken by Punith
  totalPartnerDraws: number;    // Total partner draws taken
  retainedEarnings: number;     // Profit left inside agency after partner draws

  // Cash & Working Capital
  liquidAgencyCash: number;     // Current available cash in bank
  accountsReceivable: number;   // Pending client invoices (unpaid income)
  accountsPayable: number;      // Pending bills to editors & vendors (unpaid expenses)

  // Categorization
  revenueByClient: { client: string; amount: number; pct: number }[];
  expensesByCategory: { category: string; amount: number; pct: number }[];
  topEditorsPay: { editor: string; amount: number }[];
}

export function calculateAccountingSummary(transactions: Transaction[]): AccountingSummary {
  const isPaid = (t: Transaction) => t.status === 'paid' && !t.deleted_at;
  const isUnpaid = (t: Transaction) => t.status === 'unpaid' && !t.deleted_at;

  let grossRevenue = 0;
  let operatingExpenses = 0;
  let abdulDraws = 0;
  let punithDraws = 0;
  let totalPartnerDraws = 0;

  let accountsReceivable = 0;
  let accountsPayable = 0;

  const clientMap = new Map<string, number>();
  const expenseCatMap = new Map<string, number>();
  const editorPayMap = new Map<string, number>();

  for (const t of transactions) {
    if (t.deleted_at) continue;

    if (t.type === 'income') {
      if (isPaid(t)) {
        grossRevenue += t.amount;
        clientMap.set(t.party, (clientMap.get(t.party) || 0) + t.amount);
      } else if (isUnpaid(t)) {
        accountsReceivable += t.amount;
      }
    } else if (t.type === 'expense') {
      if (isPartnerDraw(t)) {
        if (isPaid(t)) {
          totalPartnerDraws += t.amount;
          const pLower = (t.party || '').toLowerCase();
          const dLower = (t.descr || '').toLowerCase();

          if (pLower.includes('abdul') || pLower.includes('rahman') || dLower.includes('abdul')) {
            abdulDraws += t.amount;
          } else if (pLower.includes('punith') || pLower.includes('partner') || dLower.includes('punith')) {
            punithDraws += t.amount;
          } else {
            abdulDraws += t.amount / 2;
            punithDraws += t.amount / 2;
          }
        }
      } else {
        // True Operating Expense
        if (isPaid(t)) {
          operatingExpenses += t.amount;
          expenseCatMap.set(t.cat, (expenseCatMap.get(t.cat) || 0) + t.amount);

          const catLower = (t.cat || '').toLowerCase();
          if (
            catLower.includes('editor') ||
            catLower.includes('freelancer') ||
            catLower.includes('creative')
          ) {
            editorPayMap.set(t.party, (editorPayMap.get(t.party) || 0) + t.amount);
          }
        } else if (isUnpaid(t)) {
          accountsPayable += t.amount;
        }
      }
    }
  }

  // Net Operating Profit = Gross Revenue minus Business Operating Expenses
  const netOperatingProfit = grossRevenue - operatingExpenses;
  const operatingMarginPct = grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;

  // Retained Earnings = Net Operating Profit minus Partner Distributions
  const retainedEarnings = netOperatingProfit - totalPartnerDraws;

  // Liquid cash in bank = Inflows minus OpEx minus Partner Draws
  const liquidAgencyCash = grossRevenue - operatingExpenses - totalPartnerDraws;

  const revenueByClient = Array.from(clientMap.entries())
    .map(([client, amount]) => ({
      client,
      amount,
      pct: grossRevenue > 0 ? Math.round((amount / grossRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesByCategory = Array.from(expenseCatMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: operatingExpenses > 0 ? Math.round((amount / operatingExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topEditorsPay = Array.from(editorPayMap.entries())
    .map(([editor, amount]) => ({ editor, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    grossRevenue,
    operatingExpenses,
    netOperatingProfit,
    operatingMarginPct,
    abdulDraws,
    punithDraws,
    totalPartnerDraws,
    retainedEarnings,
    liquidAgencyCash,
    accountsReceivable,
    accountsPayable,
    revenueByClient,
    expensesByCategory,
    topEditorsPay,
  };
}
