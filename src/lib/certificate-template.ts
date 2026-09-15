import { EMPOWR_LOGO_DATA_URI } from "./certificate-logo";

// Layout and wording ported from the handover's certificate template
// (Empowr-Safeguarding-Coach-Certificate.pdf) rather than re-designed, since
// this is the document a coach keeps as proof of certification.
export const COURSE_TITLE = "Empowr: Safeguarding for Roller Skating Coaches";

export interface CertificateData {
  readonly coachName: string;
  readonly dateCompletedLabel: string;
  readonly renewsAtLabel: string;
  readonly certificateNumber: string;
  readonly passMark: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderCertificateHtml(data: CertificateData): string {
  const coachName = escapeHtml(data.coachName);
  const certificateNumber = escapeHtml(data.certificateNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 297mm;
    height: 210mm;
    font-family: -apple-system, "Segoe UI", Arial, sans-serif;
    background: #fdfcfa;
    color: #1b1b1b;
  }
  .top-bar {
    position: relative;
    height: 14mm;
    background: #4a70c2;
  }
  .top-bar::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 16%;
    height: 100%;
    background: #ff6161;
  }
  .frame {
    margin: 10mm 14mm 0;
    height: 176mm;
    border: 2px solid #4a70c2;
    border-radius: 18px;
    position: relative;
    padding: 10mm 16mm;
    text-align: center;
  }
  .dot {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
  .dot.red { top: 14px; right: 14px; background: #e04444; }
  .dot.blue { bottom: 14px; left: 14px; background: #4a70c2; }
  .logo { height: 20mm; margin-top: 2mm; }
  .eyebrow {
    margin-top: 6mm;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #4a70c2;
  }
  h1 {
    margin: 4mm 0 0;
    font-size: 34px;
    font-weight: 900;
    letter-spacing: -0.01em;
  }
  .lede {
    margin: 5mm 0 0;
    font-size: 15px;
    color: #7a7a8a;
  }
  .coach-name {
    display: inline-block;
    margin: 4mm auto 0;
    padding-bottom: 3mm;
    font-size: 30px;
    font-weight: 800;
    color: #4a70c2;
    border-bottom: 2px solid #4a70c2;
  }
  .course-title {
    margin: 6mm 0 0;
    font-size: 19px;
    font-weight: 800;
  }
  .tagline {
    margin: 3mm auto 0;
    max-width: 160mm;
    font-size: 13px;
    color: #7a7a8a;
    line-height: 1.5;
  }
  .info-box {
    margin: 8mm auto 0;
    max-width: 190mm;
    display: flex;
    justify-content: space-around;
    background: #eef3fc;
    border-radius: 12px;
    padding: 6mm 4mm;
  }
  .info-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #4a70c2;
  }
  .info-value {
    margin-top: 2mm;
    font-size: 15px;
    font-weight: 800;
  }
  .signatures {
    margin: 12mm 20mm 0;
    display: flex;
    justify-content: space-between;
  }
  .signature {
    width: 60mm;
    border-top: 1px solid #1b1b1b;
    padding-top: 2mm;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #1b1b1b;
  }
  .footer {
    position: absolute;
    bottom: 8mm;
    left: 0;
    right: 0;
    font-size: 11px;
    color: #7a7a8a;
  }
</style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="frame">
    <span class="dot red"></span>
    <span class="dot blue"></span>
    <img class="logo" src="${EMPOWR_LOGO_DATA_URI}" alt="" />
    <p class="eyebrow">Empowr Coach Development</p>
    <h1>Certificate of Completion</h1>
    <p class="lede">This certificate is proudly awarded to</p>
    <div class="coach-name">${coachName}</div>
    <p class="lede">for successfully completing</p>
    <p class="course-title">${COURSE_TITLE}</p>
    <p class="tagline">
      and demonstrating the required understanding of child-centred, safe coaching practice.<br />
      Minimum pass mark: ${data.passMark}%
    </p>
    <div class="info-box">
      <div>
        <div class="info-label">Date completed</div>
        <div class="info-value">${data.dateCompletedLabel}</div>
      </div>
      <div>
        <div class="info-label">Renewal due</div>
        <div class="info-value">${data.renewsAtLabel}</div>
      </div>
      <div>
        <div class="info-label">Certificate number</div>
        <div class="info-value">${certificateNumber}</div>
      </div>
    </div>
    <div class="signatures">
      <div class="signature">Authorised Signatory</div>
      <div class="signature">Empowr Management Team</div>
    </div>
    <p class="footer">Empowr CIC &nbsp;|&nbsp; eccp.empowrcic.org &nbsp;|&nbsp; eccp@empowrcic.org</p>
  </div>
</body>
</html>`;
}
