import React, { useState, useId } from 'react';
import { Transaction, formatCurrency, triggerHaptic } from '../lib/supabase';
import { generateReceiptImageBlob, ReceiptOptions } from '../lib/receiptCanvas';
import {
  X,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  CreditCard,
  Percent,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  userName,
}) => {
  if (!isOpen || !transaction) return null;

  const defaultReceiptNo = `SM-${transaction.date.replace(/-/g, '')}-${transaction.id.slice(-4).toUpperCase()}`;

  const [docType, setDocType] = useState<'receipt' | 'invoice'>('receipt');
  const [receiptNo, setReceiptNo] = useState<string>(defaultReceiptNo);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI / Bank Transfer');
  const [hasGst, setHasGst] = useState<boolean>(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [authorizedBy, setAuthorizedBy] = useState<string>(
    transaction.by_name || userName || 'Scale Magnet Financials'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<string>('');

  const subtotal = transaction.amount;
  const gstAmount = hasGst ? (subtotal * gstRate) / 100 : 0;
  const totalAmount = subtotal + gstAmount;
  const isPaid = transaction.status === 'paid';

  const receiptOptions: ReceiptOptions = {
    docType,
    receiptNo,
    paymentMethod,
    hasGst,
    gstRate,
    authorizedBy,
  };

  const getReceiptBlob = async (): Promise<Blob> => {
    return await generateReceiptImageBlob(transaction, receiptOptions);
  };

  const handleDownloadImage = async () => {
    triggerHaptic(10);
    try {
      setIsGenerating(true);
      const blob = await getReceiptBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Scale_Magnet_${docType}_${transaction.party.replace(/\s+/g, '_')}_${transaction.date}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShareSuccess('Receipt downloaded as image!');
      setTimeout(() => setShareSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to download image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    triggerHaptic(10);
    setIsGenerating(true);
    setShareSuccess('');

    const formattedText = `*SCALE MAGNET — ${docType.toUpperCase()}* ⚡\n` +
      `Receipt No: ${receiptNo}\n` +
      `Client: ${transaction.party}\n` +
      `Amount: ${formatCurrency(totalAmount)}\n` +
      `Service: ${transaction.cat}\n` +
      `Date: ${transaction.date}\n` +
      `Payment: ${paymentMethod}\n` +
      `Status: ${isPaid ? 'PAID & VERIFIED ✅' : 'PENDING ⏳'}\n` +
      `Authorized: ${authorizedBy}\n\n` +
      `Thank you for scaling with Scale Magnet!`;

    try {
      const blob = await getReceiptBlob();
      const file = new File(
        [blob],
        `Scale_Magnet_${docType}_${receiptNo}.png`,
        { type: 'image/png' }
      );

      const nav = typeof window !== 'undefined' ? window.navigator : null;

      // Check if navigator.canShare supports files
      if (nav && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          title: `Scale Magnet ${docType === 'receipt' ? 'Receipt' : 'Invoice'} - ${transaction.party}`,
          text: formattedText,
          files: [file],
        });
        setShareSuccess('Shared successfully!');
        setTimeout(() => setShareSuccess(''), 3000);
        return;
      }

      // Fallback: share text only
      if (nav && typeof (nav as any).share === 'function') {
        await (nav as any).share({
          title: `Scale Magnet ${docType === 'receipt' ? 'Receipt' : 'Invoice'}`,
          text: formattedText,
        });
        setShareSuccess('Shared text via mobile menu!');
        setTimeout(() => setShareSuccess(''), 3000);
        return;
      }

      // Fallback: copy text + download image
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        await nav.clipboard.writeText(formattedText);
      }
      await handleDownloadImage();
      setShareSuccess('Copied text & downloaded image!');
      setTimeout(() => setShareSuccess(''), 3000);
    } catch (err) {
      // User cancelled share or other error
      console.log('Share interaction ended:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    triggerHaptic(8);
    const formattedText = `*SCALE MAGNET — ${docType.toUpperCase()}* ⚡\n` +
      `Receipt No: ${receiptNo}\n` +
      `Client: ${transaction.party}\n` +
      `Amount Paid: ${formatCurrency(totalAmount)}\n` +
      `Service: ${transaction.cat}\n` +
      `Date: ${transaction.date}\n` +
      `Method: ${paymentMethod}\n` +
      `Status: ${isPaid ? 'PAID & VERIFIED ✅' : 'PENDING ⏳'}\n` +
      `Authorized: ${authorizedBy}\n\n` +
      `Thank you for scaling with Scale Magnet!`;

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (e) {}
  };

  const handlePrint = () => {
    triggerHaptic(8);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
        className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto bg-[#ffffff] dark:bg-[#181715] rounded-t-3xl sm:rounded-3xl border border-[#e4e2da] dark:border-[#33322e] shadow-2xl p-4 sm:p-6 pb-[calc(28px+env(safe-area-inset-bottom,0px))] space-y-4"
      >
        {/* Drag handle for mobile */}
        <div className="w-10 h-1.5 bg-[#d8d6ce] dark:bg-[#383733] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6] dark:border-[#2b2a26]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0d234a] text-white flex items-center justify-center font-bold text-xs">
              SM
            </div>
            <div>
              <h2 id="receipt-modal-title" className="text-base font-bold text-[#1b1b19] dark:text-[#efeee9]">
                Share Invoice & Receipt
              </h2>
              <p className="text-[11px] text-[#6c6b65] dark:text-[#9b998f]">
                Scale Magnet Official Brand Template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6c6b65] dark:text-[#9b998f] hover:bg-[#f0eee6] dark:hover:bg-[#282723]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {shareSuccess && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {shareSuccess}
          </div>
        )}

        {/* Quick Customization Controls */}
        <div className="bg-[#f7f6f2] dark:bg-[#22211e] p-3 rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            {/* Document Type Toggle */}
            <div className="flex p-0.5 bg-[#e9e7df] dark:bg-[#2e2c28] rounded-lg">
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setDocType('receipt');
                }}
                className={`px-3 py-1 font-semibold rounded-md transition ${
                  docType === 'receipt'
                    ? 'bg-white dark:bg-[#181715] text-[#0d234a] dark:text-[#5cc0a0] shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Receipt
              </button>
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setDocType('invoice');
                }}
                className={`px-3 py-1 font-semibold rounded-md transition ${
                  docType === 'invoice'
                    ? 'bg-white dark:bg-[#181715] text-[#0d234a] dark:text-[#5cc0a0] shadow-xs'
                    : 'text-[#6c6b65] dark:text-[#9b998f]'
                }`}
              >
                Tax Invoice
              </button>
            </div>

            {/* GST 18% Toggle */}
            <button
              onClick={() => {
                triggerHaptic(8);
                setHasGst(!hasGst);
              }}
              className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition ${
                hasGst
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#181715] border-[#e4e2da] dark:border-[#383733] text-[#6c6b65]'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>{hasGst ? 'GST 18% Active' : '+ Add GST'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] block mb-0.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#181715] border border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9] focus:outline-none"
              >
                <option value="UPI / Bank Transfer">UPI / GPay / PhonePe</option>
                <option value="Bank NEFT / RTGS">Bank NEFT / RTGS</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Direct Deposit / Wire">Wire Transfer</option>
                <option value="Cash / Petty Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#6c6b65] dark:text-[#9b998f] block mb-0.5">
                Receipt Number
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#181715] border border-[#e4e2da] dark:border-[#383733] text-[#1b1b19] dark:text-[#efeee9] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* The Formal Document Card (Printable Target) */}
        <div
          id="printable-receipt"
          className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
        >
          {/* Brand Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0d234a] via-[#0d234a] to-[#149e3e] rounded-full" />

          {/* Logo & Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Official Scale Magnet Logo */}
              <img
                src="/scale-magnet-logo.png"
                alt="Scale Magnet"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Scale Magnet Digital Growth Agency
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#0d234a] block">
                {docType === 'receipt' ? 'Payment Receipt' : 'Tax Invoice'}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-0.5">
                #{receiptNo}
              </span>
              <span className="text-xs text-slate-500 block">
                Date: {transaction.date}
              </span>
            </div>
          </div>

          {/* Status Pill */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING'}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Verified Electronic Record
            </span>
          </div>

          {/* Billed To / Party Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                {docType === 'receipt' ? 'Received From:' : 'Billed To:'}
              </span>
              <div className="text-sm font-bold text-slate-900">
                {transaction.party}
              </div>
              {transaction.descr && (
                <div className="text-slate-500 italic mt-0.5">
                  Ref: {transaction.descr}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Payment Details:
              </span>
              <div className="font-semibold text-slate-800">
                Method: {paymentMethod}
              </div>
              <div className="text-slate-500 mt-0.5">
                Category: {transaction.cat}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d234a] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Service / Item</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {transaction.cat}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {transaction.descr || 'Scale Magnet Agency Campaign Execution'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600 font-mono">1</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown & Total Box */}
          <div className="space-y-1.5 text-xs text-right pt-1">
            <div className="flex justify-between text-slate-500 px-1">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {hasGst && (
              <div className="flex justify-between text-slate-500 px-1">
                <span>GST ({gstRate}%):</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatCurrency(gstAmount)}
                </span>
              </div>
            )}

            {/* Total Paid Highlight */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 mt-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#149e3e]">
                Total Amount Paid
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#149e3e] tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Authorization & Signature Stamp */}
          <div className="flex items-end justify-between pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Authorized Signatory
              </span>
              <div className="font-bold text-slate-900">
                {authorizedBy}
              </div>
              <div className="text-[11px] text-slate-500">
                Scale Magnet Operations
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d234a]">
                <ShieldCheck className="w-4 h-4 text-[#149e3e]" />
                <span>SCALE MAGNET OFFICIAL</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Computer-generated digital receipt
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 pt-1">
            Thank you for scaling with Scale Magnet! Together we scale higher.
          </div>
        </div>

        {/* Action Buttons Bar (Thumb-reachable on mobile) */}
        <div className="space-y-2 pt-2">
          {/* Primary Action: Share with WhatsApp / Mobile Sheet */}
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-[#149e3e] hover:bg-[#118434] active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>
              {isGenerating ? 'Rendering Image...' : 'Share Receipt (WhatsApp / Apps)'}
            </span>
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="py-2.5 px-2 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#efece3] font-semibold text-xs flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition border border-[#e4e2da] dark:border-[#383733]"
            >
              <Download className="w-4 h-4 text-[#0d234a] dark:text-[#5cc0a0]" />
              <span>Save Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-2 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#efece3] font-semibold text-xs flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition border border-[#e4e2da] dark:border-[#383733]"
            >
              <Printer className="w-4 h-4 text-[#0d234a] dark:text-[#5cc0a0]" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-2 rounded-xl bg-[#f7f6f2] dark:bg-[#242320] text-[#1b1b19] dark:text-[#efeee9] hover:bg-[#efece3] font-semibold text-xs flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition border border-[#e4e2da] dark:border-[#383733]"
            >
              {copiedText ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-[#0d234a] dark:text-[#5cc0a0]" />
              )}
              <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
