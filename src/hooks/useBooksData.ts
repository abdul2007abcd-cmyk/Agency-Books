import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, Transaction, ActivityLog, formatCurrency, triggerHaptic } from '../lib/supabase';

const LS_NAME_KEY = 'ab.name';
const LS_TX_KEY = 'ab.c1';
const LS_ACT_KEY = 'ab.c2';

export function useBooksData() {
  const [userName, setUserNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const cached = localStorage.getItem(LS_TX_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const cached = localStorage.getItem(LS_ACT_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setUserName = (name: string) => {
    const trimmed = name.trim();
    setUserNameState(trimmed);
    try {
      localStorage.setItem(LS_NAME_KEY, trimmed);
    } catch {
      // Ignore localStorage errors
    }
  };

  const mapFromRow = (r: any): Transaction => ({
    id: r.id,
    type: r.type,
    date: r.date,
    party: r.party,
    cat: r.cat,
    descr: r.descr || '',
    amount: Number(r.amount),
    status: r.status,
    by_name: r.by_name || '',
    created: Number(r.created),
    deleted_at: r.deleted_at ? Number(r.deleted_at) : null,
    deleted_by: r.deleted_by || null,
  });

  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const [txRes, actRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('activity_log').select('*').order('at', { ascending: false }).limit(200),
      ]);

      if (txRes.error || actRes.error) {
        throw new Error(txRes.error?.message || actRes.error?.message || 'Sync error');
      }

      if (txRes.data) {
        const parsedTx = txRes.data.map(mapFromRow);
        setTransactions(parsedTx);
        try {
          localStorage.setItem(LS_TX_KEY, JSON.stringify(parsedTx));
        } catch {}
      }

      if (actRes.data) {
        const parsedAct = actRes.data as ActivityLog[];
        setActivities(parsedAct);
        try {
          localStorage.setItem(LS_ACT_KEY, JSON.stringify(parsedAct));
        } catch {}
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      console.warn('Network sync failed, falling back to local cache:', err);
      setErrorMessage('Offline - showing saved data');
      try {
        const cachedTx = localStorage.getItem(LS_TX_KEY);
        if (cachedTx) setTransactions(JSON.parse(cachedTx));
        const cachedAct = localStorage.getItem(LS_ACT_KEY);
        if (cachedAct) setActivities(JSON.parse(cachedAct));
      } catch {}
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Set up listeners for online/offline and Supabase realtime
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial fetch
    refreshData();

    // Supabase Realtime channel
    const channel = supabase
      .channel('books_realtime_mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => {
        refreshData();
      })
      .subscribe();

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.deleted_at);
  }, [transactions]);

  // Client/Vendor auto-suggest names
  const recentParties = useMemo(() => {
    const set = new Set<string>();
    const sorted = [...activeTransactions].sort((a, b) => b.created - a.created);
    for (const t of sorted) {
      if (t.party && t.party.trim()) {
        set.add(t.party.trim());
      }
      if (set.size >= 12) break;
    }
    return Array.from(set);
  }, [activeTransactions]);

  const addTransaction = async (entry: {
    type: 'income' | 'expense';
    amount: number;
    party: string;
    cat: string;
    date: string;
    status: 'paid' | 'unpaid';
    descr: string;
  }) => {
    triggerHaptic(15);
    const newId = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const author = userName.trim() || 'Anonymous';
    const newTx: Transaction = {
      id: newId,
      type: entry.type,
      amount: entry.amount,
      party: entry.party.trim(),
      cat: entry.cat,
      date: entry.date,
      status: entry.status,
      descr: entry.descr.trim(),
      by_name: author,
      created: Date.now(),
      deleted_at: null,
      deleted_by: null,
    };

    // Optimistic update
    setTransactions((prev) => [newTx, ...prev]);

    try {
      const { error: txErr } = await supabase.from('transactions').insert({
        id: newTx.id,
        type: newTx.type,
        date: newTx.date,
        party: newTx.party,
        cat: newTx.cat,
        descr: newTx.descr,
        amount: newTx.amount,
        status: newTx.status,
        by_name: author,
        created: newTx.created,
      });

      if (txErr) throw txErr;

      const summary = `${newTx.party} · ${formatCurrency(newTx.amount)} (${newTx.type})`;
      await supabase.from('activity_log').insert({
        action: 'added',
        entry_id: newTx.id,
        summary,
        by_name: author,
        at: Date.now(),
      });

      refreshData();
      return true;
    } catch (err: any) {
      console.error('Failed to add transaction:', err);
      refreshData();
      throw err;
    }
  };

  const updateStatus = async (id: string, newStatus: 'paid' | 'unpaid') => {
    triggerHaptic(12);
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      const author = userName.trim() || 'Someone';
      const summary = `${target.party} · ${formatCurrency(target.amount)} (${target.type})`;
      await supabase.from('activity_log').insert({
        action: 'marked ' + newStatus,
        entry_id: id,
        summary,
        by_name: author,
        at: Date.now(),
      });

      refreshData();
    } catch (err) {
      console.error('Failed to update status:', err);
      refreshData();
    }
  };

  const deleteTransaction = async (id: string) => {
    triggerHaptic(20);
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    const author = userName.trim() || 'Someone';
    const now = Date.now();

    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deleted_at: now, deleted_by: author } : t))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: now, deleted_by: author })
        .eq('id', id);

      if (error) throw error;

      const summary = `${target.party} · ${formatCurrency(target.amount)} (${target.type})`;
      await supabase.from('activity_log').insert({
        action: 'deleted',
        entry_id: id,
        summary,
        by_name: author,
        at: now,
      });

      refreshData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      refreshData();
    }
  };

  const restoreTransaction = async (id: string) => {
    triggerHaptic(15);
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    const author = userName.trim() || 'Someone';

    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deleted_at: null, deleted_by: null } : t))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null, deleted_by: null })
        .eq('id', id);

      if (error) throw error;

      const summary = `${target.party} · ${formatCurrency(target.amount)} (${target.type})`;
      await supabase.from('activity_log').insert({
        action: 'restored',
        entry_id: id,
        summary,
        by_name: author,
        at: Date.now(),
      });

      refreshData();
    } catch (err) {
      console.error('Failed to restore transaction:', err);
      refreshData();
    }
  };

  const importTransactions = async (rows: any[]) => {
    const valid = rows
      .filter((x) => x && x.id && x.date && x.amount >= 0)
      .map((x) => ({
        id: x.id,
        type: x.type,
        date: x.date,
        party: x.party,
        cat: x.cat,
        descr: x.descr || x.desc || '',
        amount: Number(x.amount),
        status: x.status,
        by_name: x.by_name || x.by || userName || '',
        created: x.created || Date.now(),
      }));

    if (!valid.length) throw new Error('No valid transactions found in file.');

    const { error } = await supabase
      .from('transactions')
      .upsert(valid, { onConflict: 'id', ignoreDuplicates: true });

    if (error) throw error;

    await supabase.from('activity_log').insert({
      action: 'imported',
      entry_id: '-',
      summary: `${valid.length} entries imported from backup`,
      by_name: userName || 'Someone',
      at: Date.now(),
    });

    refreshData();
  };

  return {
    userName,
    setUserName,
    transactions,
    activeTransactions,
    activities,
    recentParties,
    isSyncing,
    isOnline,
    lastSyncTime,
    errorMessage,
    refreshData,
    addTransaction,
    updateStatus,
    deleteTransaction,
    restoreTransaction,
    importTransactions,
  };
}
