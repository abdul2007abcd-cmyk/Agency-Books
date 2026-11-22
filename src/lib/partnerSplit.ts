import { Transaction, formatCurrency } from './supabase';

export interface PartnerConfig {
  partner1Name: string;
  partner2Name: string;
  partner1SharePct: number;
  partner2SharePct: number;
  agencyReservePct: number;
}

export const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
  partner1Name: 'Abdul',
  partner2Name: 'Punith',
  partner1SharePct: 50,
  partner2SharePct: 50,
  agencyReservePct: 0,
};

export interface PartnerSplitSummary {
  totalIncome: number;
  operatingExpenses: number;
  operatingProfit: number;
  agencyReserveAmount: number;
  distributableProfit: number;

  partner1Name: string;
  partner1Pct: number;
  partner1Gross: number;
  partner1Draws: number;
  partner1NetDue: number;

  partner2Name: string;
  partner2Pct: number;
  partner2Gross: number;
  partner2Draws: number;
  partner2NetDue: number;

  totalDraws: number;
  periodLabel: string;
}

export function calculatePartnerSplit(
  transactions: Transaction[],
  config: PartnerConfig,
  periodLabel: string = 'Current'
): PartnerSplitSummary {
  const isPaid = (t: Transaction) => t.status === 'paid' && !t.deleted_at;

  const p1NameLower = (config.partner1Name || '').trim().toLowerCase();
  const p2NameLower = (config.partner2Name || '').trim().toLowerCase();

  let totalIncome = 0;
  let operatingExpenses = 0;
  let partner1Draws = 0;
  let partner2Draws = 0;

  for (const t of transactions) {
    if (!isPaid(t)) continue;

    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      const isDraw =
        t.cat === 'Partner Draw / Profit Share' ||
        t.cat.toLowerCase().includes('partner draw') ||
        t.cat.toLowerCase().includes('profit share');

      if (isDraw) {
        const partyLower = t.party.toLowerCase();
        const descLower = t.descr.toLowerCase();

        // Match partner 1 (Abdul / legacy Rahman)
        const isP1 =
          (p1NameLower && (partyLower.includes(p1NameLower) || descLower.includes(p1NameLower))) ||
          (p1NameLower === 'abdul' && (partyLower.includes('rahman') || descLower.includes('rahman')));

        // Match partner 2 (Punith / legacy Partner 2)
        const isP2 =
          (p2NameLower && (partyLower.includes(p2NameLower) || descLower.includes(p2NameLower))) ||
          (p2NameLower === 'punith' && (partyLower.includes('partner 2') || partyLower.includes('partner2')));

        if (isP1) {
          partner1Draws += t.amount;
        } else if (isP2) {
          partner2Draws += t.amount;
        } else {
          // If neither matches specifically, split the draw
          partner1Draws += t.amount / 2;
          partner2Draws += t.amount / 2;
        }
      } else {
        operatingExpenses += t.amount;
      }
    }
  }

  const operatingProfit = totalIncome - operatingExpenses;
  const reservePct = Math.max(0, Math.min(50, config.agencyReservePct || 0));
  const agencyReserveAmount = operatingProfit > 0 ? (operatingProfit * reservePct) / 100 : 0;
  const distributableProfit = Math.max(0, operatingProfit - agencyReserveAmount);

  const p1Pct = config.partner1SharePct || 50;
  const p2Pct = config.partner2SharePct || 50;

  const partner1Gross = (distributableProfit * p1Pct) / 100;
  const partner2Gross = (distributableProfit * p2Pct) / 100;

  const partner1NetDue = partner1Gross - partner1Draws;
  const partner2NetDue = partner2Gross - partner2Draws;

  return {
    totalIncome,
    operatingExpenses,
    operatingProfit,
    agencyReserveAmount,
    distributableProfit,
    partner1Name: config.partner1Name || 'Partner 1',
    partner1Pct: p1Pct,
    partner1Gross,
    partner1Draws,
    partner1NetDue,
    partner2Name: config.partner2Name || 'Partner 2',
    partner2Pct: p2Pct,
    partner2Gross,
    partner2Draws,
    partner2NetDue,
    totalDraws: partner1Draws + partner2Draws,
    periodLabel,
  };
}

/**
 * Generate high-DPI Partner Distribution Statement Image Blob
 */
export async function generatePartnerStatementImage(
  summary: PartnerSplitSummary
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 1120;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Load Logo
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve;
    logo.src = '/scale-magnet-logo.png';
  });

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top banner accent
  ctx.fillStyle = '#0d234a';
  ctx.fillRect(0, 0, width, 10);
  ctx.fillStyle = '#149e3e';
  ctx.fillRect(width * 0.5, 0, width * 0.5, 10);

  // Outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Logo
  if (logo.complete && logo.naturalWidth > 0) {
    ctx.drawImage(logo, 50, 45, 210, 70);
  } else {
    ctx.fillStyle = '#0d234a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SCALE MAGNET', 50, 75);
  }

  // Right Header
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0d234a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PARTNER PROFIT STATEMENT', width - 50, 70);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Scale Magnet Digital Growth Agency', width - 50, 92);
  ctx.fillText(`Period: ${summary.periodLabel}`, width - 50, 112);
  ctx.fillText(`Generated: ${new Date().toLocaleDateString('en-IN')}`, width - 50, 130);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 155);
  ctx.lineTo(width - 50, 155);
  ctx.stroke();

  // Partnership Split Badge
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.roundRect(50, 175, 260, 32, 16);
  ctx.fill();

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(
    `PARTNERSHIP RATIO: ${summary.partner1Pct}% / ${summary.partner2Pct}%`,
    66,
    196
  );

  // Agency Financial Summary Box
  const boxY = 230;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(50, boxY, width - 100, 125, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('AGENCY PERFORMANCE SUMMARY', 70, boxY + 28);

  // 3-metric columns inside box
  const colW = (width - 140) / 3;
  // Income
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Gross Revenue Inflow:', 70, boxY + 60);
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(formatCurrency(summary.totalIncome), 70, boxY + 86);

  // Op Expenses
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Operating Expenses:', 70 + colW, boxY + 60);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(formatCurrency(summary.operatingExpenses), 70 + colW, boxY + 86);

  // Net Operating Profit
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Net Distributable Profit:', 70 + colW * 2, boxY + 60);
  ctx.fillStyle = '#0d234a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(formatCurrency(summary.distributableProfit), 70 + colW * 2, boxY + 86);

  // Partner Split Breakdown Cards (Two Columns)
  const cardY = 385;
  const cardW = (width - 120) / 2;
  const cardH = 340;

  // Partner 1 Card
  drawPartnerCard(
    ctx,
    50,
    cardY,
    cardW,
    cardH,
    summary.partner1Name,
    summary.partner1Pct,
    summary.partner1Gross,
    summary.partner1Draws,
    summary.partner1NetDue,
    '#0d234a'
  );

  // Partner 2 Card
  drawPartnerCard(
    ctx,
    50 + cardW + 20,
    cardY,
    cardW,
    cardH,
    summary.partner2Name,
    summary.partner2Pct,
    summary.partner2Gross,
    summary.partner2Draws,
    summary.partner2NetDue,
    '#149e3e'
  );

  // Settlement & Disbursed Summary Box
  const settleY = cardY + cardH + 30;
  ctx.fillStyle = '#f0fdf4';
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, settleY, width - 100, 95, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#166534';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('PARTNER SETTLEMENT OVERVIEW', 70, settleY + 32);

  ctx.fillStyle = '#334155';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `${summary.partner1Name}: ${summary.partner1NetDue >= 0 ? 'Receives' : 'Overdrawn by'} ${formatCurrency(Math.abs(summary.partner1NetDue))}`,
    70,
    settleY + 58
  );
  ctx.fillText(
    `${summary.partner2Name}: ${summary.partner2NetDue >= 0 ? 'Receives' : 'Overdrawn by'} ${formatCurrency(Math.abs(summary.partner2NetDue))}`,
    70,
    settleY + 78
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#149e3e';
  ctx.font = 'bold 22px sans-serif';
  const totalNetPayable = Math.max(0, summary.partner1NetDue) + Math.max(0, summary.partner2NetDue);
  ctx.fillText(formatCurrency(totalNetPayable), width - 70, settleY + 55);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Total Net Disbursable', width - 70, settleY + 75);

  // Signatures Area
  const signY = height - 150;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, signY);
  ctx.lineTo(width - 50, signY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText(`PARTNER SIGNATORY: ${summary.partner1Name.toUpperCase()}`, 50, signY + 30);
  ctx.fillText('Scale Magnet Partner', 50, signY + 50);

  ctx.textAlign = 'right';
  ctx.fillText(`PARTNER SIGNATORY: ${summary.partner2Name.toUpperCase()}`, width - 50, signY + 30);
  ctx.fillText('Scale Magnet Partner', width - 50, signY + 50);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    'Scale Magnet Internal Partner Distribution & Equity Audit Document',
    width / 2,
    height - 45
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob'));
    }, 'image/png');
  });
}

function drawPartnerCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  partnerName: string,
  splitPct: number,
  grossShare: number,
  draws: number,
  netBalance: number,
  accentColor: string
) {
  // Card base
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  // Top header banner
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 44, [12, 12, 0, 0]);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(partnerName, x + 16, y + 28);

  ctx.textAlign = 'right';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`${splitPct}% SHARE`, x + w - 16, y + 28);

  // Content items
  const startY = y + 75;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Gross Profit Entitlement:', x + 16, startY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(formatCurrency(grossShare), x + w - 16, startY);

  const dY = startY + 45;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Personal Draws Taken:', x + 16, dY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`- ${formatCurrency(draws)}`, x + w - 16, dY);

  // Divider
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 16, dY + 30);
  ctx.lineTo(x + w - 16, dY + 30);
  ctx.stroke();

  // Net Balance Box
  const netBoxY = dY + 45;
  const isPositive = netBalance >= 0;
  ctx.fillStyle = isPositive ? '#f0fdf4' : '#fef2f2';
  ctx.strokeStyle = isPositive ? '#bbf7d0' : '#fecaca';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 16, netBoxY, w - 32, 95, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = isPositive ? '#166534' : '#991b1b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(isPositive ? 'NET BALANCE DUE TO PAY' : 'OVERDRAWN AMOUNT', x + 28, netBoxY + 30);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(formatCurrency(Math.abs(netBalance)), x + 28, netBoxY + 68);
}
