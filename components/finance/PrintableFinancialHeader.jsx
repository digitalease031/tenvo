'use client';

import React from 'react';

/**
 * Standard international printable header for financial statements & ledgers.
 * Hidden on screen, visible only during print.
 */
export function PrintableFinancialHeader({ business, title, periodLabel, currency }) {
  const businessName = business?.business_name || business?.name || 'Business Name';
  const ntn = business?.ntn || business?.settings?.ntn || business?.settings?.tax?.ntn;
  const address = business?.address;

  const metaParts = [];
  if (ntn) metaParts.push(`NTN / Tax ID: ${ntn}`);
  if (address) metaParts.push(address);
  if (currency) metaParts.push(`Currency: ${currency}`);

  return (
    <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-900">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900">{businessName}</h1>
          {metaParts.length > 0 && (
            <p className="text-xs text-gray-600 mt-1 font-medium">{metaParts.join('  ·  ')}</p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase text-gray-900">{title}</h2>
          {periodLabel && <p className="text-xs text-gray-700 font-semibold mt-1">{periodLabel}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Standard international printable footer for financial statements & ledgers.
 * Hidden on screen, visible only during print.
 */
export function PrintableFinancialFooter({ footnote = 'Confidential · Prepared for Audit & Financial Review' }) {
  const generatedAt = new Date().toLocaleString();
  return (
    <div className="hidden print:flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-300 pt-3 mt-8">
      <span>{footnote}</span>
      <span>Printed on {generatedAt}</span>
    </div>
  );
}
