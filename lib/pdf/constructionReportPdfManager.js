/**
 * Construction Domain PDF Report Manager
 * Handles PDF generation, printing, and download for all standard construction industry reports:
 * 1. IPC Running Bill PDF (FIDIC / PEC Standard)
 * 2. BOQ Schedule & Composite Rate Estimate PDF
 * 3. PEC Clause 70 Price Escalation Claim Statement PDF
 * 4. Site Operations Daily Work Report & Safety Compliance PDF
 * 5. Construction Executive Portfolio & Retention Ledger PDF
 */

import { buildIPCBillHtml } from './ipcBillPdf';
import { buildBOQEstimateHtml } from './boqEstimatePdf';
import { buildEscalationClaimHtml } from './constructionEscalationPdf';
import { buildSiteDailyReportHtml } from './constructionSiteReportPdf';
import { buildConstructionFinancialReportHtml } from './constructionFinancialReportPdf';
import { exportConstructionLetterheadPdf as exportLetterhead } from './constructionLetterheadPdf';
import notify from '@/lib/utils/appToast';

function openPdfPrintWindow(htmlContent, title = 'Construction Report') {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'width=950,height=800');
  if (!printWindow) {
    notify.error('Pop-up blocked. Please allow pop-ups to export PDF reports.');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

export function exportIPCBillPdf({ ipc, project, business }) {
  const html = buildIPCBillHtml({ ipc, project, business });
  openPdfPrintWindow(html, `IPC_${ipc?.ipc_code || 'Bill'}`);
  notify.compactSave('IPC Running Bill PDF generated');
}

export function exportBOQEstimatePdf({ boqItems, project, business }) {
  const html = buildBOQEstimateHtml({ boqItems, project, business });
  openPdfPrintWindow(html, `BOQ_${project?.code || 'Estimate'}`);
  notify.compactSave('BOQ Schedule PDF generated');
}

export function exportClause70EscalationPdf({ claim, project, business }) {
  const html = buildEscalationClaimHtml({ claim, project, business });
  openPdfPrintWindow(html, `Escalation_Claim_${project?.code || 'PEC'}`);
  notify.compactSave('PEC Clause 70 Escalation Claim PDF generated');
}

export function exportSiteDailyReportPdf({ project, date, business }) {
  const html = buildSiteDailyReportHtml({ project, date, business });
  openPdfPrintWindow(html, `Daily_Site_Report_${project?.code || 'Log'}`);
  notify.compactSave('Site Operations Daily Report PDF generated');
}

export function exportExecutiveFinancialPdf({ projects, business }) {
  const html = buildConstructionFinancialReportHtml({ projects, business });
  openPdfPrintWindow(html, 'Executive_Construction_Financial_Summary');
  notify.compactSave('Executive Financial Portfolio PDF generated');
}

export function exportConstructionLetterheadPdf(config) {
  return exportLetterhead(config);
}

