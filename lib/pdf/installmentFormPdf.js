/**
 * Generates an official, standard, high-resolution PDF document for Tenvo Vehicle & EV Installment Application Form.
 * Supports vehicle-dealership, auto-marketplace, rent-a-car, ev-bikes, and electronics stores.
 */
import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

/**
 * @param {object} params
 */
export async function generateInstallmentFormPdf({
  storeName = 'Tenvo Motors Showroom',
  selectedVehicle = 'Vehicle / Product Model',
  productPrice = 245000,
  downPaymentAmount = 49000,
  downPaymentPct = 20,
  durationMonths = 24,
  monthlyInstallment = 10208,
  applicant = {},
  contact = {},
  category = 'vehicle-dealership',
  business = {},
}) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const contentW = pageW - margin * 2;

  // Resolve brand color or default to automotive red / indigo
  const brandRgb = resolveInvoiceBrandColor(business, business?.settingsParsed);
  const COLOR_BRAND = brandRgb && brandRgb.length === 3 ? brandRgb : [220, 38, 38];
  const COLOR_SLATE_DARK = [15, 23, 42]; // #0f172a
  const COLOR_SLATE_TEXT = [30, 41, 59]; // #1e293b
  const COLOR_MUTED_TEXT = [100, 116, 139]; // #64748b
  const COLOR_BORDER = [203, 213, 225]; // #cbd5e1
  const COLOR_BG_LIGHT = [248, 250, 252]; // #f8fafc

  let y = 0;

  // ── Top Header Banner ──────────────────────────────────────────────
  doc.setFillColor(...COLOR_SLATE_DARK);
  doc.rect(0, 0, pageW, 26, 'F');

  // Brand color top strip
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(0, 26, pageW, 1.5, 'F');

  // Header Title Text Left
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(String(storeName || 'TENVO SHOWROOM').toUpperCase(), margin, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_BRAND);
  doc.text('OFFICIAL FINANCING & LEASING SUITE', margin, 18);

  // Header Right Meta
  const appSerial = `TNV-FIN-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(appSerial, pageW - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageW - margin, 18, { align: 'right' });

  y = 33;

  // ── Showroom / Business Info Box ──────────────────────────────────────────
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_SLATE_TEXT);
  doc.text(`Dealer / Showroom: ${storeName}`, margin + 3, y + 5);

  const contactEmail = contact?.email || business?.email || 'support@tenvo.store';
  const contactPhone = contact?.phone || business?.phone || '+92 300 0000000';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED_TEXT);
  doc.text(`Helpline / Phone: ${contactPhone} | Email: ${contactEmail}`, margin + 3, y + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_BRAND);
  doc.text('Scheme: Tenvo Showroom Easy Installments', pageW - margin - 3, y + 7, { align: 'right' });

  y += 16;

  // ── SECTION 1: FINANCING PLAN SUMMARY ──────────────────────────────
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('1. VEHICLE / PRODUCT FINANCING & PLAN SUMMARY', margin + 3, y + 4.2);

  y += 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLOR_BORDER);
  doc.rect(margin, y, contentW, 20, 'D');

  const formattedPrice = Number(productPrice || 0).toLocaleString('en-PK');
  const formattedDown = Number(downPaymentAmount || 0).toLocaleString('en-PK');
  const formattedMonthly = Number(monthlyInstallment || 0).toLocaleString('en-PK');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_TEXT);

  // Row 1
  doc.text('Vehicle / Model:', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(String(selectedVehicle || 'Vehicle Model').toUpperCase(), margin + 28, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Agreed Price:', margin + 115, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${formattedPrice}`, margin + 138, y + 5);

  // Divider line
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(margin, y + 8, pageW - margin, y + 8);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Down Payment:', margin + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`PKR ${formattedDown} (${downPaymentPct}%)`, margin + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Tenure:', margin + 75, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${durationMonths} Months`, margin + 90, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_BRAND);
  doc.text('Monthly Installment:', margin + 115, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(`PKR ${formattedMonthly} / mo`, margin + 148, y + 13);

  y += 24;

  // ── SECTION 2: APPLICANT PERSONAL & CONTACT DETAILS ─────────────────
  doc.setFillColor(...COLOR_SLATE_DARK);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('2. APPLICANT PERSONAL & CONTACT DETAILS (MANDATORY PHONE & CNIC)', margin + 3, y + 4.2);

  y += 6;
  doc.setDrawColor(...COLOR_BORDER);
  doc.rect(margin, y, contentW, 58, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_TEXT);

  // Full Name
  doc.text('Full Name (as per CNIC):', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.fullName || applicant.buyerName || '', margin + 42, y + 6);
  doc.line(margin + 40, y + 7, pageW - margin - 3, y + 7);

  // CNIC Number
  doc.setFont('helvetica', 'bold');
  doc.text('CNIC Number *:', margin + 3, y + 14);
  doc.setFont('helvetica', 'normal');
  const cnicVal = applicant.cnic || applicant.buyerCnic || '';
  doc.text(cnicVal || '[  _  _  _  _  _  ]  -  [  _  _  _  _  _  _  _  ]  -  [  _  ]', margin + 42, y + 14);

  // Father/Husband Name
  doc.setFont('helvetica', 'bold');
  doc.text('Father / Husband Name:', margin + 3, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.fatherName || '', margin + 42, y + 22);
  doc.line(margin + 40, y + 23, pageW - margin - 3, y + 23);

  // Phone & Email
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile Phone *:', margin + 3, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.phone || applicant.buyerPhone || '', margin + 28, y + 30);
  doc.line(margin + 26, y + 31, margin + 85, y + 31);

  doc.setFont('helvetica', 'bold');
  doc.text('Email Address:', margin + 92, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.email || '', margin + 118, y + 30);
  doc.line(margin + 116, y + 31, pageW - margin - 3, y + 31);

  // City & Employment
  doc.setFont('helvetica', 'bold');
  doc.text('City / District:', margin + 3, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.city || '', margin + 28, y + 38);
  doc.line(margin + 26, y + 39, margin + 85, y + 39);

  doc.setFont('helvetica', 'bold');
  doc.text('Employment Status:', margin + 92, y + 38);
  const empText = applicant.employmentType === 'business'
    ? '[  ] Salaried     [ X ] Business / Self-Employed'
    : '[ X ] Salaried     [  ] Business / Self-Employed';
  doc.setFont('helvetica', 'normal');
  doc.text(empText, margin + 124, y + 38);

  // Residential Address
  doc.setFont('helvetica', 'bold');
  doc.text('Residential Address:', margin + 3, y + 46);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.address || applicant.buyerAddress || '', margin + 38, y + 46);
  doc.line(margin + 35, y + 47, pageW - margin - 3, y + 47);

  // Employer / Business
  doc.setFont('helvetica', 'bold');
  doc.text('Employer / Business Name:', margin + 3, y + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.employerName || '', margin + 45, y + 54);
  doc.line(margin + 42, y + 55, margin + 115, y + 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Income: PKR', margin + 120, y + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(applicant.monthlyIncome ? String(applicant.monthlyIncome) : '', margin + 155, y + 54);
  doc.line(margin + 155, y + 55, pageW - margin - 3, y + 55);

  y += 62;

  // ── SECTION 3: GUARANTOR / REFERENCE DETAILS ────────────────────────
  doc.setFillColor(...COLOR_SLATE_DARK);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('3. GUARANTOR & PERSONAL REFERENCES (2 MANDATORY REFERENCES)', margin + 3, y + 4.2);

  y += 6;
  const colW = (contentW - 4) / 2;

  const w1Name = applicant.witness1Name || '';
  const w1Phone = applicant.witness1Phone || '';
  const w1Cnic = applicant.witness1Cnic || '';

  const w2Name = applicant.witness2Name || '';
  const w2Phone = applicant.witness2Phone || '';
  const w2Cnic = applicant.witness2Cnic || '';

  // Guarantor 1 Box
  doc.setDrawColor(...COLOR_BORDER);
  doc.rect(margin, y, colW, 30, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_BRAND);
  doc.text('GUARANTOR 1 DETAILS (GAWAAH 1)', margin + 3, y + 5);

  doc.setTextColor(...COLOR_SLATE_TEXT);
  doc.setFontSize(7.5);
  doc.text(`Name: ${w1Name || '_________________________________'}`, margin + 3, y + 11);
  doc.text(`CNIC: ${w1Cnic || '_____-_______-_'}  Phone: ${w1Phone || '_________'}`, margin + 3, y + 17);
  doc.text('Relation: ____________  City: ____________', margin + 3, y + 23);
  doc.text('Signature: ______________________________', margin + 3, y + 28);

  // Guarantor 2 Box
  doc.rect(margin + colW + 4, y, colW, 30, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_BRAND);
  doc.text('GUARANTOR 2 DETAILS (GAWAAH 2)', margin + colW + 7, y + 5);

  doc.setTextColor(...COLOR_SLATE_TEXT);
  doc.setFontSize(7.5);
  doc.text(`Name: ${w2Name || '_________________________________'}`, margin + colW + 7, y + 11);
  doc.text(`CNIC: ${w2Cnic || '_____-_______-_'}  Phone: ${w2Phone || '_________'}`, margin + colW + 7, y + 17);
  doc.text('Relation: ____________  City: ____________', margin + colW + 7, y + 23);
  doc.text('Signature: ______________________________', margin + colW + 7, y + 28);

  y += 34;

  // ── SECTION 4: MANDATORY DOCUMENTS CHECKLIST ─────────────────────────
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('4. MANDATORY DOCUMENTATION SUBMISSION GUIDE', margin + 3, y + 4.2);

  y += 6;
  doc.rect(margin, y, colW, 28, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_TEXT);
  doc.text('FOR SALARIED EMPLOYEES:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('[  ] Copy of Valid CNIC (Self & 2 Guarantors)', margin + 3, y + 11);
  doc.text('[  ] Salary Slips for Last 3 Months (Stamped)', margin + 3, y + 16);
  doc.text('[  ] Active Bank Account Statement (Last 6 Months)', margin + 3, y + 21);
  doc.text('[  ] Copy of Recent Utility Bill (Electricity/Gas)', margin + 3, y + 26);

  // Business Box
  doc.rect(margin + colW + 4, y, colW, 28, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_TEXT);
  doc.text('FOR BUSINESS / SELF-EMPLOYED:', margin + colW + 7, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('[  ] Copy of Valid CNIC (Self & 2 Guarantors)', margin + colW + 7, y + 11);
  doc.text('[  ] Bank Account Statement (Last 6 Months)', margin + colW + 7, y + 16);
  doc.text('[  ] Copy of Recent Utility Bill (Commercial/Home)', margin + colW + 7, y + 21);
  doc.text('[  ] FBR NTN Certificate & Tax Return Filing Copy', margin + colW + 7, y + 26);

  y += 32;

  // ── SECTION 5: DECLARATION & SIGNATURES ──────────────────────────────
  doc.setFillColor(...COLOR_SLATE_DARK);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('5. APPLICANT DECLARATION & AUTHORIZATION', margin + 3, y + 4.2);

  y += 6;
  doc.rect(margin, y, contentW, 22, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED_TEXT);
  const declaration =
    'I hereby declare that all information provided in this application form is true and complete to the best of my knowledge. I authorize the showroom, its financing partners, and credit verification officers to inspect submitted documents, perform background checks, and verify CNIC and credit bureau records for installment processing.';
  doc.text(doc.splitTextToSize(declaration, contentW - 6), margin + 3, y + 4.5);

  // Signature lines inside Section 5
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_SLATE_TEXT);

  doc.text('Applicant Signature: __________________', margin + 3, y + 3);
  doc.text('Guarantor Signature: __________________', margin + 65, y + 3);
  doc.text('Showroom Stamp: __________________', margin + 130, y + 3);

  // ── Footer Bar ──────────────────────────────────────────────────────
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED_TEXT);
  doc.text(`${storeName} · Installment Financing Suite · www.tenvo.store`, margin, pageH - 7);
  doc.text('Page 1 of 1', pageW - margin, pageH - 7, { align: 'right' });

  return doc;
}
