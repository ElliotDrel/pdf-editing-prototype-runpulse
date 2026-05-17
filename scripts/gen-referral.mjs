import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../public/sample-referral.pdf');

async function generate() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.10, 0.09, 0.08);
  const mid = rgb(0.40, 0.38, 0.35);
  const light = rgb(0.72, 0.68, 0.62);

  // Off-white background
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(0.957, 0.941, 0.902) });

  const cx = 306;

  const title = 'SPECIALIST REFERRAL REQUEST';
  const titleW = helvBold.widthOfTextAtSize(title, 15);
  page.drawText(title, { x: cx - titleW / 2, y: 742, size: 15, font: helvBold, color: dark });

  const sub = 'Form #SR-2026-0872  ·  BLUE CROSS PREFERRED';
  const subW = helv.widthOfTextAtSize(sub, 9);
  page.drawText(sub, { x: cx - subW / 2, y: 724, size: 9, font: helv, color: mid });

  const drawLine = (y) =>
    page.drawLine({ start: { x: 42, y }, end: { x: 570, y }, thickness: 0.5, color: light });

  const drawLabel = (text, x, y) =>
    page.drawText(text, { x, y, size: 7.5, font: helvBold, color: mid });

  const drawValue = (text, x, y) =>
    page.drawText(text, { x, y, size: 11, font: helv, color: dark });

  const drawUnderline = (x, y, w) =>
    page.drawLine({ start: { x, y: y - 4 }, end: { x: x + w, y: y - 4 }, thickness: 0.75, color: light });

  const drawSection = (text, y) =>
    page.drawText(text, { x: 42, y, size: 7.5, font: helvBold, color: mid });

  drawLine(712);

  // PATIENT INFORMATION
  drawSection('PATIENT INFORMATION', 699);
  drawLine(690);

  drawLabel('PATIENT NAME', 42, 679);
  drawUnderline(42, 661, 300);
  drawValue('Marcus T. Rivera', 42, 661);

  drawLabel('DATE OF BIRTH', 380, 679);
  drawUnderline(380, 661, 190);
  drawValue('07/22/1979', 380, 661);

  drawLabel('INSURANCE ID', 42, 645);
  drawUnderline(42, 627, 280);
  drawValue('UHC-5521-0093', 42, 627);

  drawLine(613);

  // REFERRING PROVIDER
  drawSection('REFERRING PROVIDER', 601);
  drawLine(592);

  drawLabel('REFERRING PROVIDER', 42, 581);
  drawUnderline(42, 563, 300);
  drawValue('Dr. Sarah L. Kim', 42, 563);

  drawLabel('NPI', 380, 581);
  drawUnderline(380, 563, 190);
  drawValue('1298374650', 380, 563);

  drawLabel('SPECIALTY REQUESTED', 42, 547);
  drawUnderline(42, 529, 300);
  drawValue('Endocrinology', 42, 529);

  drawLine(515);

  // CLINICAL INFORMATION
  drawSection('CLINICAL INFORMATION', 503);
  drawLine(494);

  drawLabel('URGENCY', 42, 483);
  drawValue('[X] Semi-urgent   [ ] Routine   [ ] STAT', 42, 465);

  drawLabel('PRIMARY DIAGNOSIS (ICD-10)', 42, 449);
  drawUnderline(42, 431, 250);
  drawValue('E11.65', 42, 431);

  drawLabel('CLINICAL NOTES', 42, 415);
  drawUnderline(42, 397, 530);
  drawValue('Uncontrolled T2DM, eval for insulin therapy', 42, 397);

  // Signature block
  drawLine(90);
  drawLabel('REFERRING PROVIDER SIGNATURE', 42, 79);
  drawUnderline(42, 65, 280);
  drawLabel('DATE', 380, 79);
  drawUnderline(380, 65, 150);

  page.drawText(
    'Valid 90 days from issue. Specialist response required within 5 business days.',
    { x: 42, y: 38, size: 7, font: helv, color: light }
  );

  const bytes = await doc.save();
  writeFileSync(OUT_PATH, bytes);
  console.log(`Generated: ${OUT_PATH} (${bytes.length} bytes)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
