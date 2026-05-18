import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../public/sample-prior-auth.pdf');

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

  const title = 'PRIOR AUTHORIZATION REQUEST';
  const titleW = helvBold.widthOfTextAtSize(title, 15);
  page.drawText(title, { x: cx - titleW / 2, y: 742, size: 15, font: helvBold, color: dark });

  const sub = 'PA-2026-04421  ·  MEDPLAN COMMERCIAL';
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

  drawLine(712);

  // Row 1: Patient Name + DOB
  drawLabel('PATIENT NAME', 42, 699);
  drawUnderline(42, 681, 340);
  drawValue('Margaret O. Chen', 42, 681);

  drawLabel('DATE OF BIRTH', 420, 699);
  drawUnderline(420, 681, 150);
  drawValue('03/14/1962', 420, 681);

  // Row 2: Member ID + Group Number
  drawLabel('MEMBER ID', 42, 660);
  drawUnderline(42, 642, 250);
  drawValue('BCBS-7745-2298', 42, 642);

  drawLabel('GROUP NUMBER', 330, 660);
  drawUnderline(330, 642, 240);
  drawValue('GRP-44219', 330, 642);

  // Row 3: ICD-10 + Service Date
  drawLabel('PRIMARY DIAGNOSIS (ICD-10)', 42, 621);
  drawUnderline(42, 603, 250);
  drawValue('E11.65', 42, 603);

  drawLabel('SERVICE DATE', 330, 621);
  drawUnderline(330, 603, 240);
  drawValue('06/02/2026', 330, 603);

  // Place of Service
  drawLabel('PLACE OF SERVICE', 42, 582);
  drawUnderline(42, 564, 528);
  drawValue('Outpatient Hospital', 42, 564);

  // Urgency
  drawLabel('URGENCY', 42, 543);
  drawValue('[X] Routine   [ ] Urgent   [ ] STAT', 42, 525);

  // Provider / NPI
  drawLabel('TREATING PROVIDER  ·  NPI', 42, 504);
  drawUnderline(42, 486, 528);
  drawValue('Patel, R.  ·  1487338921', 42, 486);

  drawLine(90);
  drawLabel('REQUESTING PROVIDER SIGNATURE', 42, 79);
  drawUnderline(42, 65, 280);
  drawLabel('DATE', 380, 79);
  drawUnderline(380, 65, 150);

  page.drawText(
    'Incomplete requests will be returned. Processing time: 3–5 business days standard, 24 hrs urgent.',
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
