/**
 * Construction Domain Letterhead PDF & Print Generator
 * Formats official construction company letterheads with uploaded logo,
 * architectural top ribbon accents, background watermark, angled footer, and A4 print layout.
 */

import notify from '@/lib/utils/appToast';

export function buildLetterheadHtml(config = {}) {
  const {
    logoUrl = '/storefront/construction/logo-whitehouse.png',
    logoHeight = 70,
    logoPosition = 'left', // 'left' | 'center' | 'right'
    headerStyle = 'angled-ribbon', // 'angled-ribbon' | 'clean-border' | 'corporate-bar' | 'minimal'
    companyName = 'WHITE HOUSE CONSTRUCTIONS',
    tagline = 'BUILDING TRUST. CREATING FUTURES.',
    pecInfo = 'PEC License Category: C-2 (Civil)',
    ntnStrn = 'NTN: 4029182-7 | STRN: 3277870192812',
    primaryColor = '#7A1C2C', // WhiteHouse Maroon
    secondaryColor = '#4A4A4A', // Charcoal Gray
    
    showWatermark = true,
    watermarkUrl = '/storefront/construction/logo-whitehouse.png',
    watermarkOpacity = 0.06,
    watermarkPosition = 'bottom-right', // 'bottom-right' | 'center'
    watermarkScale = 460,

    footerStyle = 'angled-block', // 'angled-block' | 'clean-icons' | 'minimal'
    address = 'Office no: 5B fifth floor, Midway Pearl Building, Midway Commercial, Bahria Town Karachi',
    email = 'whitehouseconstructions@yahoo.com',
    phone = '03003232896',
    website = '',

    refNo = 'WHC/PRJ-2026/LTR-084',
    date = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
    recipientName = 'The Superintending Engineer',
    recipientTitle = 'Infrastructure & Works Division',
    recipientCompany = 'Department of Public Works / Bahria Town Karachi',
    recipientAddress = 'Sindh, Pakistan',
    subject = 'RE: COMMERCIAL TOWER SITE QUALITY AUDIT & PROGRESS REPORT',
    salutation = 'Dear Sir,',
    bodyText = `We are pleased to submit the official progress update and quality compliance verification report for the ongoing structural works. All concrete casting and Grade 60 steel rebar testing conform strictly to PEC standard specifications and approved BOQ benchmarks.

Should you require any further documentation or site inspection, please do not hesitate to contact our project manager directly. We remain committed to maintaining the highest engineering standards and timely project delivery.`,
    signatoryName = 'Engr. Zeeshan Keerio',
    signatoryTitle = 'Managing Director / Chief Executive',
    showStampArea = true,
    isBlankStationery = false,
  } = config;

  // Process bodyText into paragraphs
  const bodyParagraphs = String(bodyText || '')
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin-bottom: 14px; text-align: justify; line-height: 1.6;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('');

  // Watermark CSS positioning
  let watermarkStyleCss = '';
  if (watermarkPosition === 'bottom-right') {
    watermarkStyleCss = `
      position: absolute;
      bottom: 60px;
      right: -20px;
      width: ${watermarkScale}px;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 1;
    `;
  } else {
    watermarkStyleCss = `
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${watermarkScale}px;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 1;
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Letterhead - ${companyName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Open Sans', Arial, sans-serif;
      font-size: 11.5px;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      width: 210mm;
      min-height: 297mm;
      position: relative;
    }
    .page-container {
      position: relative;
      min-height: 297mm;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    
    /* Top Header Accent Shapes */
    .top-ribbon-bar {
      position: relative;
      width: 100%;
      height: 16px;
      background: #ffffff;
      border-bottom: 1px solid ${primaryColor};
    }
    .top-ribbons-svg {
      position: absolute;
      top: 0;
      right: 40px;
      height: 22px;
      width: 140px;
    }

    .header-content {
      padding: 24px 36px 12px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .company-logo {
      height: ${logoHeight}px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
    }
    .company-identity {
      display: flex;
      flex-direction: column;
    }
    .company-name {
      font-size: 20px;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: 0.05em;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .company-tagline {
      font-size: 9.5px;
      font-weight: 700;
      color: ${secondaryColor};
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-top: 4px;
      padding-top: 3px;
      border-top: 1px solid ${primaryColor};
      display: inline-block;
    }
    .company-credentials {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
    }

    .header-divider {
      margin: 0 36px;
      border-bottom: 2px solid ${primaryColor};
      opacity: 0.85;
    }

    /* Main Letter Content Body */
    .letter-body {
      padding: 28px 42px;
      flex-grow: 1;
      position: relative;
      z-index: 2;
    }

    .letter-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      font-size: 11px;
    }
    .meta-ref {
      font-weight: 700;
      color: #0f172a;
    }
    .meta-date {
      font-weight: 600;
      color: #475569;
    }

    .recipient-block {
      margin-bottom: 20px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .recipient-name {
      font-weight: 700;
      color: #0f172a;
    }
    .recipient-company {
      font-weight: 600;
      color: #334155;
    }

    .subject-line {
      font-size: 12px;
      font-weight: 800;
      color: ${primaryColor};
      margin: 18px 0 18px 0;
      padding-bottom: 4px;
      border-bottom: 1px dashed #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .salutation {
      font-weight: 700;
      margin-bottom: 14px;
      color: #0f172a;
    }

    .prose-text {
      font-size: 11.5px;
      color: #1e293b;
    }

    /* Signatory & Stamp Area */
    .signatory-container {
      margin-top: 42px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .signatory-box {
      display: inline-block;
    }
    .sig-line {
      width: 200px;
      border-top: 1.5px solid ${secondaryColor};
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
    }

    .stamp-box {
      width: 105px;
      height: 105px;
      border: 2px dashed ${primaryColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 8.5px;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      padding: 8px;
      opacity: 0.45;
      transform: rotate(-8deg);
    }

    /* Bottom Angled Footer */
    .footer-wrapper {
      position: relative;
      z-index: 2;
      width: 100%;
      margin-top: auto;
    }
    .footer-top-line {
      height: 2px;
      background: ${primaryColor};
      width: 100%;
    }
    .footer-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 10px 24px 10px 0px;
      border-bottom: 3px solid ${primaryColor};
      position: relative;
    }
    .footer-left-block {
      display: flex;
      align-items: center;
      position: relative;
    }
    .footer-polygon {
      width: 110px;
      height: 48px;
      background: ${primaryColor};
      clip-path: polygon(0 0, 80% 0, 100% 100%, 0% 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-polygon-accent {
      width: 18px;
      height: 48px;
      background: ${secondaryColor};
      margin-left: -20px;
      clip-path: polygon(50% 0, 100% 0, 50% 100%, 0% 100%);
    }
    .footer-contacts {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-left: 20px;
      flex-grow: 1;
      font-size: 9.5px;
      color: #334155;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .contact-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${primaryColor};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
    }
    .contact-text {
      line-height: 1.25;
      font-weight: 600;
    }

    @media print {
      body { width: 210mm; min-height: 297mm; }
      .page-container { min-height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    
    <!-- Optional Watermark -->
    ${showWatermark && watermarkUrl ? `
      <img src="${watermarkUrl}" alt="Watermark" style="${watermarkStyleCss}" />
    ` : ''}

    <!-- Top Architectural Accents & Header -->
    <div>
      ${headerStyle === 'angled-ribbon' ? `
        <div class="top-ribbon-bar">
          <svg class="top-ribbons-svg" viewBox="0 0 140 22">
            <polygon points="40,0 75,0 55,22 20,22" fill="${primaryColor}" />
            <polygon points="80,0 115,0 95,22 60,22" fill="${secondaryColor}" />
            <line x1="110" y1="3" x2="140" y2="3" stroke="${primaryColor}" stroke-width="1.5" />
          </svg>
        </div>
      ` : `
        <div style="height: 6px; background: ${primaryColor}; width: 100%;"></div>
      `}

      <div class="header-content">
        <div class="logo-container">
          ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="Company Logo" />` : ''}
          <div class="company-identity">
            <div class="company-name">${companyName}</div>
            <div class="company-tagline">${tagline}</div>
            <div class="company-credentials">${pecInfo} &bull; ${ntnStrn}</div>
          </div>
        </div>
      </div>
      <div class="header-divider"></div>
    </div>

    <!-- Letter Body (Or Blank Stationery) -->
    <div class="letter-body">
      ${!isBlankStationery ? `
        <div class="letter-meta">
          <div class="meta-ref">Ref No: <span>${refNo}</span></div>
          <div class="meta-date">Date: <span>${date}</span></div>
        </div>

        <div class="recipient-block">
          <div class="recipient-name">To: ${recipientName}</div>
          <div style="color: #475569;">${recipientTitle}</div>
          <div class="recipient-company">${recipientCompany}</div>
          <div style="color: #64748b;">${recipientAddress}</div>
        </div>

        ${subject ? `<div class="subject-line">${subject}</div>` : ''}

        <div class="salutation">${salutation}</div>

        <div class="prose-text">
          ${bodyParagraphs}
        </div>

        <div class="signatory-container">
          <div class="signatory-box">
            <div style="margin-bottom: 24px; font-weight: 600; color: #475569;">Yours Sincerely,</div>
            <div class="sig-line"></div>
            <div class="sig-name">${signatoryName}</div>
            <div class="sig-title">${signatoryTitle}</div>
            <div style="font-size: 9px; font-weight: 700; color: ${primaryColor}; margin-top: 2px;">${companyName}</div>
          </div>

          ${showStampArea ? `
            <div class="stamp-box">
              Official<br />Company<br />Seal / Stamp
            </div>
          ` : ''}
        </div>
      ` : `
        <div style="height: 500px; display: flex; align-items: center; justify-content: center;">
          <p style="font-size: 10px; color: #cbd5e1; font-style: italic;">[ Blank Pre-formatted Letterhead Stationery Mode ]</p>
        </div>
      `}
    </div>

    <!-- Bottom Angled Footer -->
    <div class="footer-wrapper">
      <div class="footer-top-line"></div>
      <div class="footer-content">
        <div class="footer-left-block">
          <div class="footer-polygon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
          </div>
          <div class="footer-polygon-accent"></div>
        </div>

        <div class="footer-contacts">
          <div class="contact-item">
            <div class="contact-icon">&#9990;</div>
            <div class="contact-text">
              <div style="font-weight: 700;">Location</div>
              <div>${address}</div>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon">&#9993;</div>
            <div class="contact-text">
              <div style="font-weight: 700;">Email Us</div>
              <div>${email}</div>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon">&#9742;</div>
            <div class="contact-text">
              <div style="font-weight: 700;">Direct Phone</div>
              <div>${phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
}

export function exportConstructionLetterheadPdf(config = {}) {
  if (typeof window === 'undefined') return;

  const htmlContent = buildLetterheadHtml(config);
  const printWindow = window.open('', '_blank', 'width=950,height=850');
  
  if (!printWindow) {
    notify.error('Pop-up blocked. Please allow pop-ups to print or export PDF.');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  notify.compactSave('Construction Letterhead PDF generated');
}
