import React, { useState } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import {
  PartnerConfig,
  PartnerSplitSummary,
  calculatePartnerSplit,
  generatePartnerStatementImage,
} from '../lib/partnerSplit';
import {
  X,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  Users,
  Settings,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface PartnerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  partnerConfig: PartnerConfig;
  onUpdatePartnerConfig: (cfg: PartnerConfig) => void;
  onRecordDraw: (entry: {
    partnerName: string;
    amount: number;
    date: string;
    descr: string;
  }) => Promise<void>;
  userName: string;
}

export const PartnerSplitModal: React.FC<PartnerSplitModalProps> = ({
  isOpen,
  onClose,
  transactions,
  partnerConfig,
  onUpdatePartnerConfig,
  onRecordDraw,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'draw' | 'settings'>('statement');
  const [period, setPeriod] = useState<'this' | 'last' | 'all'>('this');

  // Config form state
  const [p1Name, setP1Name] = useState(partnerConfig.partner1Name);
  const [p2Name, setP2Name] = useState(partnerConfig.partner2Name);
  const [p1Pct, setP1Pct] = useState(partnerConfig.partner1SharePct);
  const [reservePct, setReservePct] = useState(partnerConfig.agencyReservePct);

  // Draw form state
  const [drawPartner, setDrawPartner] = useState<string>(partnerConfig.partner1Name);
  const [drawAmount, setDrawAmount] = useState<string>('');
  const [drawNote, setDrawNote] = useState<string>('');
  const [drawDate, setDrawDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isSubmittingDraw, setIsSubmittingDraw] = useState(false);

  // Sharing state
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  // Filter transactions by selected period
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const periodFiltered = transactions.filter((t) => {
    if (period === 'all') return true;
    if (period === 'this') return t.date.startsWith(currentMonthStr);
    if (period === 'last') return t.date.startsWith(lastMonthStr);
    return true;
  });

  const periodLabel =
    period === 'this' ? 'This Month' : period === 'last' ? 'Last Month' : 'All Time';

  const summary = calculatePartnerSplit(periodFiltered, partnerConfig, periodLabel);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(10);
    const validP1Pct = Math.max(0, Math.min(100, Number(p1Pct) || 50));
    const newConfig: PartnerConfig = {
      partner1Name: p1Name.trim() || 'Partner 1',
      partner2Name: p2Name.trim() || 'Partner 2',
      partner1SharePct: validP1Pct,
      partner2SharePct: 100 - validP1Pct,
      agencyReservePct: Math.max(0, Math.min(50, Number(reservePct) || 0)),
    };
    onUpdatePartnerConfig(newConfig);
    setStatusMsg('Partner split settings saved!');
    setTimeout(() => setStatusMsg(''), 2500);
    setActiveTab('statement');
  };

  const handleRecordDrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(drawAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setIsSubmittingDraw(true);
      await onRecordDraw({
        partnerName: drawPartner || partnerConfig.partner1Name,
        amount,
        date: drawDate,
        descr: drawNote.trim() || 'Partner profit withdrawal / draw',
      });
      setDrawAmount('');
      setDrawNote('');
      setStatusMsg(`Draw of ${formatCurrency(amount)} recorded successfully!`);
      setTimeout(() => setStatusMsg(''), 3000);
      setActiveTab('statement');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingDraw(false);
    }
  };

  const handleDownloadStatement = async () => {
    triggerHaptic(10);
    try {
      setIsGenerating(true);
      const blob = await generatePartnerStatementImage(summary);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Scale_Magnet_Partner_Split_${period}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg('Statement downloaded as image!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    triggerHaptic(10);
    setIsGenerating(true);
    setStatusMsg('');

    const formattedText =
      `*SCALE MAGNET — PARTNER PROFIT SPLIT* ⚡\n` +
      `Period: ${summary.periodLabel}\n` +
      `Partnership Ratio: ${summary.partner1Pct}% / ${summary.partner2Pct}%\n\n` +
      `📊 *Agency Performance:*\n` +
      `• Gross Revenue: ${formatCurrency(summary.totalIncome)}\n` +
      `• Operating Expenses: ${formatCurrency(summary.operatingExpenses)}\n` +
      `• Net Profit: ${formatCurrency(summary.operatingProfit)}\n` +
      (summary.agencyReserveAmount > 0 ? `• Retained Reserve: ${formatCurrency(summary.agencyReserveAmount)}\n` : '') +
      `• Distributable Pool: ${formatCurrency(summary.distributableProfit)}\n\n` +
      `🤝 *Partner Balances:*\n` +
      `1️⃣ *${summary.partner1Name} (${summary.partner1Pct}%):*\n` +
      `   Entitlement: ${formatCurrency(summary.partner1Gross)}\n` +
      `   Draws Taken: ${formatCurrency(summary.partner1Draws)}\n` +
      `   👉 *Net Due: ${formatCurrency(summary.partner1NetDue)}*\n\n` +
      `2️⃣ *${summary.partner2Name} (${summary.partner2Pct}%):*\n` +
      `   Entitlement: ${formatCurrency(summary.partner2Gross)}\n` +
      `   Draws Taken: ${formatCurrency(summary.partner2Draws)}\n` +
      `   👉 *Net Due: ${formatCurrency(summary.partner2NetDue)}*\n\n` +
      `Generated via Scale Magnet Agency Books.`;

    try {
      const blob = await generatePartnerStatementImage(summary);
      const file = new File(
        [blob],
        `Scale_Magnet_Partner_Statement.png`,
        { type: 'image/png' }
      );

      const nav = typeof window !== 'undefined' ? window.navigator : null;
      if (nav && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          title: `Scale Magnet Partner Profit Statement`,
          text: formattedText,
          files: [file],
        });
        setStatusMsg('Statement shared successfully!');
        setTimeout(() => setStatusMsg(''), 2500);
        return;
      }

      if (nav && typeof (nav as any).share === 'function') {
        await (nav as any).share({
          title: `Scale Magnet Partner Profit Statement`,
          text: formattedText,
        });
        setStatusMsg('Shared text summary!');
        setTimeout(() => setStatusMsg(''), 2500);
        return;
      }

      // Fallback: clipboard + download
      if (nav && nav.clipboard) {
        await nav.clipboard.writeText(formattedText);
      }
      await handleDownloadStatement();
      setStatusMsg('Copied summary & downloaded image!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      console.log('Share dismissed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    triggerHaptic(8);
    const formattedText =
      `*SCALE MAGNET — PARTNER PROFIT SPLIT* ⚡\n` +
      `Period: ${summary.periodLabel}\n\n` +
      `• Total Profit Pool: ${formatCurrency(summary.distributableProfit)}\n` +
      `• ${summary.partner1Name} (${summary.partner1Pct}%): Net Due ${formatCurrency(summary.partner1NetDue)}\n` +
      `• ${summary.partner2Name} (${summary.partner2Pct}%): Net Due ${formatCurrency(summary.partner2NetDue)}\n\n` +
      `Scale Magnet Agency Books.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-split-title"
        className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto bg-[#ffffff] dark:bg-[#181715] rounded-t-3xl sm:rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-4 sm:p-6 pb-[calc(28px+env(safe-area-inset-bottom,0px))] space-y-4"
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0d234a] text-white flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4 text-[#149e3e]" />
            </div>
            <div>
              <h2 id="partner-split-title" className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
                Partner Profit Split
              </h2>
              <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                {partnerConfig.partner1Name} ({partnerConfig.partner1SharePct}%) & {partnerConfig.partner2Name} ({partnerConfig.partner2SharePct}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {statusMsg}
          </div>
        )}

        {/* Segmented Tab Navigation */}
        <div className="grid grid-cols-3 p-1 bg-[#f0eee6] dark:bg-[#282724] rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('statement');
            }}
            className={`py-2 rounded-lg transition ${
              activeTab === 'statement'
                ? 'bg-white dark:bg-[#181715] text-[#0d234a] dark:text-[#5cc0a0] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Distribution
          </button>
          <button
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('draw');
            }}
            className={`py-2 rounded-lg transition ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-[#181715] text-[#0d234a] dark:text-[#5cc0a0] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Record Draw
          </button>
          <button
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('settings');
            }}
            className={`py-2 rounded-lg transition ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-[#181715] text-[#0d234a] dark:text-[#5cc0a0] shadow-xs'
                : 'text-[#6c6b65] dark:text-[#9b998f]'
            }`}
          >
            Split Ratio
          </button>
        </div>

        {/* Tab 1: Distribution & Statement */}
        {activeTab === 'statement' && (
          <div className="space-y-4">
            {/* Period selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f]">
                Accounting Period:
              </span>
              <div className="flex items-center gap-1">
                {(['this', 'last', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      triggerHaptic(8);
                      setPeriod(p);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      period === p
                        ? 'bg-[#0d234a] text-white'
                        : 'bg-[#f0eee6] dark:bg-[#282724] text-[#6c6b65] dark:text-[#9b998f]'
                    }`}
                  >
                    {p === 'this' ? 'This Month' : p === 'last' ? 'Last Month' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Pool Summary Card */}
            <div className="bg-[#f7f6f2] dark:bg-[#22211e] border border-[#e4e2da] dark:border-[#383733] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6c6b65] dark:text-[#9b998f]">Agency Net Distributable Profit</span>
                <span className="font-bold text-[#149e3e] text-sm tabular-nums">
                  {formatCurrency(summary.distributableProfit)}
                </span>
              </div>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] flex justify-between">
                <span>Revenue: {formatCurrency(summary.totalIncome)}</span>
                <span>Expenses: {formatCurrency(summary.operatingExpenses)}</span>
              </div>
            </div>

            {/* 2-Column Partner Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Partner 1 Card */}
              <div className="bg-white dark:bg-[#1c1b18] border border-slate-200 dark:border-[#383733] rounded-2xl p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#0d234a] dark:text-[#efeee9] truncate">
                    {summary.partner1Name}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {summary.partner1Pct}%
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[#6c6b65] dark:text-[#9b998f]">
                  <div className="flex justify-between">
                    <span>Gross Share:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(summary.partner1Gross)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draws Taken:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      - {formatCurrency(summary.partner1Draws)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#2b2a26]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {summary.partner1NetDue >= 0 ? 'Net Payable to Partner' : 'Overdrawn'}
                  </div>
                  <div className="text-xl font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums mt-0.5">
                    {formatCurrency(summary.partner1NetDue)}
                  </div>
                </div>
              </div>

              {/* Partner 2 Card */}
              <div className="bg-white dark:bg-[#1c1b18] border border-slate-200 dark:border-[#383733] rounded-2xl p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#0d234a] dark:text-[#efeee9] truncate">
                    {summary.partner2Name}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {summary.partner2Pct}%
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[#6c6b65] dark:text-[#9b998f]">
                  <div className="flex justify-between">
                    <span>Gross Share:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(summary.partner2Gross)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draws Taken:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      - {formatCurrency(summary.partner2Draws)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#2b2a26]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {summary.partner2NetDue >= 0 ? 'Net Payable to Partner' : 'Overdrawn'}
                  </div>
                  <div className="text-xl font-extrabold text-[#149e3e] dark:text-[#5cc08a] tabular-nums mt-0.5">
                    {formatCurrency(summary.partner2NetDue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sharing & Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleShareWhatsApp}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-[#149e3e] hover:bg-[#118434] active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {isGenerating ? 'Rendering Statement...' : 'Share Split on WhatsApp'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadStatement}
                  disabled={isGenerating}
                  className="py-2.5 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] text-[#1b1b19] dark:text-[#efeee9] border border-[#e4e2da] dark:border-[#383733] font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-[#0d234a] dark:text-[#5cc0a0]" />
                  <span>Save Image</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="py-2.5 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] text-[#1b1b19] dark:text-[#efeee9] border border-[#e4e2da] dark:border-[#383733] font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#0d234a] dark:text-[#5cc0a0]" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Record Partner Draw */}
        {activeTab === 'draw' && (
          <form onSubmit={handleRecordDrawSubmit} className="space-y-3.5">
            <div className="text-xs text-[#6c6b65] dark:text-[#9b998f]">
              Record when you or your partner withdraws money from the business for personal income or profit draw.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Which Partner is Withdrawing?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setDrawPartner(partnerConfig.partner1Name);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    drawPartner === partnerConfig.partner1Name
                      ? 'bg-[#0d234a] text-white border-[#0d234a]'
                      : 'bg-white dark:bg-[#181715] border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9]'
                  }`}
                >
                  {partnerConfig.partner1Name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setDrawPartner(partnerConfig.partner2Name);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    drawPartner === partnerConfig.partner2Name
                      ? 'bg-[#0d234a] text-white border-[#0d234a]'
                      : 'bg-white dark:bg-[#181715] border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9]'
                  }`}
                >
                  {partnerConfig.partner2Name}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                required
                value={drawAmount}
                onChange={(e) => setDrawAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-3 text-xl font-bold bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none focus:border-[#149e3e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                value={drawNote}
                onChange={(e) => setDrawNote(e.target.value)}
                placeholder="e.g. November profit payout, personal advance"
                className="w-full px-3.5 py-2.5 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingDraw}
              className="w-full py-3.5 rounded-xl bg-[#0d234a] hover:bg-[#07152d] text-white font-bold text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmittingDraw ? 'Recording Withdrawal...' : `Record ${formatCurrency(Number(drawAmount) || 0)} Draw`}
            </button>
          </form>
        )}

        {/* Tab 3: Split Ratio & Partner Names */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveConfig} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  Partner 1 Name
                </label>
                <input
                  type="text"
                  required
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder="e.g. Rahman"
                  className="w-full px-3 py-2 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                  Partner 2 Name
                </label>
                <input
                  type="text"
                  required
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  placeholder="e.g. Partner"
                  className="w-full px-3 py-2 text-xs bg-[#f7f6f2] dark:bg-[#242320] border border-[#e4e2da] dark:border-[#383733] rounded-xl text-[#1b1b19] dark:text-[#efeee9] focus:outline-none"
                />
              </div>
            </div>

            {/* Split Ratio Presets */}
            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Profit Split Ratio: {p1Pct}% ({p1Name || 'P1'}) / {100 - p1Pct}% ({p2Name || 'P2'})
              </label>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[50, 60, 70, 80].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setP1Pct(val);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      p1Pct === val
                        ? 'bg-[#0d234a] text-white border-[#0d234a]'
                        : 'bg-white dark:bg-[#181715] text-[#6c6b65] dark:text-[#9b998f] border-[#e4e2da] dark:border-[#383733]'
                    }`}
                  >
                    {val}% / {100 - val}%
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={p1Pct}
                onChange={(e) => setP1Pct(Number(e.target.value))}
                className="w-full mt-2 accent-[#149e3e]"
              />
            </div>

            {/* Business Reserve / Buffer */}
            <div>
              <label className="block text-xs font-semibold text-[#6c6b65] dark:text-[#9b998f] mb-1">
                Retained Agency Reserve ({reservePct}%)
              </label>
              <div className="text-[11px] text-[#6c6b65] dark:text-[#9b998f] mb-2">
                Keep a percentage of profit in the agency bank account as an emergency runway buffer before splitting.
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 10, 15, 20].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setReservePct(res);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                      reservePct === res
                        ? 'bg-[#149e3e] text-white border-[#149e3e]'
                        : 'bg-white dark:bg-[#181715] text-[#6c6b65] dark:text-[#9b998f] border-[#e4e2da] dark:border-[#383733]'
                    }`}
                  >
                    {res === 0 ? 'No Buffer' : `${res}% Buffer`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0d234a] hover:bg-[#07152d] text-white font-bold text-xs shadow-md transition active:scale-[0.98]"
            >
              Save Split Ratio & Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
