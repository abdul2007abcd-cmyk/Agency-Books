import { Transaction, formatCurrency } from './supabase';

export interface ReceiptOptions {
  docType: 'receipt' | 'invoice';
  receiptNo: string;
  paymentMethod: string;
  hasGst: boolean;
  gstRate: number;
  authorizedBy: string;
}

/**
 * Renders a crisp, high-DPI receipt image on an HTML5 canvas and returns a PNG Blob
 */
export async function generateReceiptImageBlob(
  tx: Transaction,
  options: ReceiptOptions
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  // High resolution canvas for retina mobile screens
  const width = 800;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Load Scale Magnet Logo
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve; // Continue even if logo fails
    logo.src = '/scale-magnet-logo.png';
  });

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle top brand accent bar (navy and green)
  ctx.fillStyle = '#0d234a';
  ctx.fillRect(0, 0, width, 10);
  ctx.fillStyle = '#149e3e';
  ctx.fillRect(width * 0.6, 0, width * 0.4, 10);

  // Outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Draw Logo (3:1 aspect ratio)
  if (logo.complete && logo.naturalWidth > 0) {
    const logoW = 210;
    const logoH = 70;
    ctx.drawImage(logo, 50, 45, logoW, logoH);
  } else {
    // Text fallback
    ctx.fillStyle = '#0d234a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SCALE MAGNET', 50, 75);
  }

  // Right Header: Document Type & Badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0d234a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(
    options.docType === 'receipt' ? 'PAYMENT RECEIPT' : 'TAX INVOICE',
    width - 50,
    70
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Scale Magnet Digital Growth Agency', width - 50, 92);
  ctx.fillText(`Receipt #: ${options.receiptNo}`, width - 50, 112);
  ctx.fillText(`Date: ${tx.date}`, width - 50, 130);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 155);
  ctx.lineTo(width - 50, 155);
  ctx.stroke();

  // Status Stamp (Green Pill)
  const isPaid = tx.status === 'paid';
  ctx.textAlign = 'left';
  ctx.fillStyle = isPaid ? '#dcfce7' : '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(50, 175, 140, 32, 16);
  ctx.fill();

  ctx.fillStyle = isPaid ? '#15803d' : '#b45309';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(isPaid ? '✓ PAID IN FULL' : '⏳ UNPAID / DUE', 68, 196);

  // Bill To section
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RECEIVED FROM / BILLED TO:', 50, 245);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(tx.party, 50, 275);

  if (tx.descr) {
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText(`Ref: ${tx.descr}`, 50, 300);
  }

  // Payment method info box
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(width - 320, 235, 270, 75, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Payment Method:', width - 305, 260);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(options.paymentMethod, width - 305, 280);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Category: ${tx.cat}`, width - 305, 298);

  // Items Table Header
  const tableY = 340;
  ctx.fillStyle = '#0d234a';
  ctx.beginPath();
  ctx.roundRect(50, tableY, width - 100, 38, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM / SERVICE DESCRIPTION', 68, tableY + 24);
  ctx.textAlign = 'right';
  ctx.fillText('QTY', width - 200, tableY + 24);
  ctx.fillText('AMOUNT (INR)', width - 68, tableY + 24);

  // Table Row
  const rowY = tableY + 45;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(50, rowY, width - 100, 60, 6);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(tx.cat, 68, rowY + 28);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  const desc = tx.descr || 'Agency Services / Campaign Execution';
  ctx.fillText(desc.length > 50 ? desc.slice(0, 50) + '…' : desc, 68, rowY + 48);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = '14px sans-serif';
  ctx.fillText('1', width - 200, rowY + 36);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(formatCurrency(tx.amount), width - 68, rowY + 36);

  // Calculation Breakdown
  const subtotal = tx.amount;
  const gstAmount = options.hasGst ? (subtotal * options.gstRate) / 100 : 0;
  const total = subtotal + gstAmount;

  const calcStartY = rowY + 90;
  ctx.textAlign = 'right';
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';

  ctx.fillText('Subtotal:', width - 220, calcStartY);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(formatCurrency(subtotal), width - 68, calcStartY);

  let currentY = calcStartY;
  if (options.hasGst) {
    currentY += 26;
    ctx.fillStyle = '#64748b';
    ctx.fillText(`GST (${options.gstRate}%):`, width - 220, currentY);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(formatCurrency(gstAmount), width - 68, currentY);
  }

  // Total Box
  currentY += 20;
  ctx.fillStyle = '#f0fdf4';
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(width - 360, currentY, 310, 56, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#166534';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('TOTAL AMOUNT PAID', width - 340, currentY + 34);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#149e3e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(formatCurrency(total), width - 68, currentY + 36);

  // Verification & Signatory Box
  const signY = currentY + 90;
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, signY);
  ctx.lineTo(width - 50, signY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('AUTHORIZED SIGNATORY', 50, signY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(options.authorizedBy || 'Scale Magnet Accounts', 50, signY + 54);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Scale Magnet Financial Operations', 50, signY + 72);

  // Stamp badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0d234a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('SCALE MAGNET VERIFIED', width - 50, signY + 40);
  ctx.fillStyle = '#149e3e';
  ctx.font = '12px sans-serif';
  ctx.fillText('✓ Electronic Authorization Confirmed', width - 50, signY + 60);

  // Footer notes
  const footerY = height - 85;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    'Thank you for partnering with Scale Magnet. Together we scale higher.',
    width / 2,
    footerY
  );
  ctx.fillText(
    'This is a computer-generated receipt valid for business expense and account records.',
    width / 2,
    footerY + 20
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from canvas'));
    }, 'image/png');
  });
}
