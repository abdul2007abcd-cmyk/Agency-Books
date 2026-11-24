import React from 'react';
import { ActivityLog, Transaction, triggerHaptic } from '../lib/supabase';
import { RotateCcw, Clock, ShieldCheck, UserCheck } from 'lucide-react';

interface ActivityViewProps {
  activities: ActivityLog[];
  transactions: Transaction[];
  onRestore: (entryId: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  transactions,
  onRestore,
}) => {
  const formatTime = (ts: number): string => {
    if (!ts) return '';
    const date = new Date(Number(ts));
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const actionLabels: Record<string, string> = {
    added: 'added',
    deleted: 'deleted',
    restored: 'restored',
    'marked paid': 'marked as paid',
    'marked unpaid': 'marked as unpaid',
    imported: 'imported',
  };

  return (
    <div className="space-y-3 pb-28 md:pb-12 pt-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
            Activity & Audit
          </h2>
          <p className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
            Every add, delete, and change with author tracking
          </p>
        </div>
        <ShieldCheck className="w-5 h-5 text-[#1f5f4a] dark:text-[#5cc0a0]" />
      </div>

      <div className="bg-[#ffffff] dark:bg-[#1e1d1b] border border-[#e4e2da] dark:border-[#33322e] rounded-2xl p-4 divide-y divide-[#f0eee6] dark:divide-[#2b2a26]">
        {activities.length > 0 ? (
          activities.map((act, idx) => {
            const isDelete = act.action === 'deleted';
            const isRestore = act.action === 'restored';
            const actionText = actionLabels[act.action] || act.action;

            // Check if this deleted item is currently deleted and can be restored
            const targetTx = transactions.find((t) => t.id === act.entry_id);
            const canRestore = isDelete && targetTx && !!targetTx.deleted_at;

            return (
              <div key={act.id || idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-[#1b1b19] dark:text-[#efeee9] leading-relaxed">
                    <span className="font-bold text-[#1f5f4a] dark:text-[#5cc0a0]">
                      {act.by_name || 'Someone'}
                    </span>{' '}
                    <span className={isDelete ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}>
                      {actionText}
                    </span>{' '}
                    <span className="font-semibold">{act.summary}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(act.at)}</span>
                  </div>

                  {canRestore && (
                    <button
                      onClick={() => {
                        triggerHaptic(12);
                        onRestore(act.entry_id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-[#e9e7df] dark:bg-[#2c2b26] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#1f5f4a] hover:text-white dark:hover:bg-[#5cc0a0] dark:hover:text-[#121312] transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-[#6c6b65] dark:text-[#9b998f]">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
