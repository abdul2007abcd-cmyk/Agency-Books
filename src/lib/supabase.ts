import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://rjlewrlcgxnscarexaos.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbGV3cmxjZ3huc2NhcmV4YW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNTUwMDIsImV4cCI6MjExMDgzMTAwMn0.eWXAb78wcL35odjSE4ub3rn6ge-6bZZElUi9PM-6FZ0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  party: string;
  cat: string;
  descr: string;
  amount: number;
  status: 'paid' | 'unpaid';
  by_name: string;
  created: number;
  deleted_at?: number | null;
  deleted_by?: string | null;
}

export interface ActivityLog {
  id: number | string;
  at: number;
  action: string;
  entry_id: string;
  summary: string;
  by_name: string;
}

export const CATEGORIES = {
  income: [
    'Retainer',
    'Project',
    'Ad management',
    'SEO',
    'Content / Design',
    'Partner Capital Contribution',
    'Other income',
  ],
  expense: [
    'Partner Draw / Profit Share',
    'Video Editing / Creative',
    'Freelancers & Contractors',
    'Salaries & Stipends',
    'Ad spend (pass-through)',
    'Software / Tools / AI',
    'Rent / Utilities',
    'Marketing',
    'Taxes / GST',
    'Other',
  ],
};

export const formatCurrency = (val: number): string => {
  return "₹" + Number(val || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

export const triggerHaptic = (ms: number = 10) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore vibration error if not allowed by browser policy
    }
  }
};
