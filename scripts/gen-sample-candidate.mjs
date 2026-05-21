import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../public/sample-candidate.pdf');
const PRIOR_AUTH_PATH = resolve(__dirname, '../public/sample-prior-auth.pdf');

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_L = 36;
const MARGIN_R = 36;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const GAP = 16;

async function generate() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);

  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const navy = rgb(0.07, 0.16, 0.32);
  const teal = rgb(0.12, 0.55, 0.72);
  const slate = rgb(0.22, 0.28, 0.36);
  const filledGreen = rgb(0.05, 0.45, 0.22);
  const muted = rgb(0.45, 0.48, 0.52);
  const border = rgb(0.78, 0.81, 0.86);
  const panel = rgb(0.96, 0.97, 0.99);
  const white = rgb(1, 1, 1);
  const headerSub = rgb(0.75, 0.82, 0.92);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: white });
  page.drawRectangle({ x: 0, y: 0, width: 14, height: PAGE_H, color: teal });

  const headerH = 74;
  const headerBottom = PAGE_H - headerH;
  page.drawRectangle({
    x: 14,
    y: headerBottom,
    width: PAGE_W - 14,
    height: headerH,
    color: navy,
  });
  page.drawText('LABORATORY TEST REQUISITION', {
    x: MARGIN_L,
    y: PAGE_H - 30,
    size: 18,
    font: timesBold,
    color: white,
  });
  page.drawText('Metro Regional Diagnostics  ·  Req #MRD-88421', {
    x: MARGIN_L,
    y: PAGE_H - 50,
    size: 9,
    font: times,
    color: headerSub,
  });
  page.drawText('FAX BACK: (503) 555-0199', {
    x: 400,
    y: PAGE_H - 50,
    size: 9,
    font: times,
    color: headerSub,
  });

  // Cursor: yCursor is the top edge of the next block (decreases as we move down).
  let yCursor = headerBottom - GAP;

  const drawBoxTop = (x, top, w, h, fill = panel) => {
    page.drawRectangle({
      x,
      y: top - h,
      width: w,
      height: h,
      borderColor: border,
      borderWidth: 1,
      color: fill,
    });
  };

  const LABEL_SIZE = 7;

  const drawSectionLabel = (text, top, x = MARGIN_L) => {
    page.drawText(text, {
      x,
      y: top - 10,
      size: LABEL_SIZE,
      font: timesBold,
      color: slate,
    });
  };

  const drawSectionLabelBaseline = (text, baselineY, x = MARGIN_L) => {
    page.drawText(text, {
      x,
      y: baselineY,
      size: LABEL_SIZE,
      font: timesBold,
      color: slate,
    });
  };

  const drawInBox = (entries, boxTop, boxLeft, boxW, boxH, padX = 8, padY = 12) => {
    let y = boxTop - padY;
    for (const entry of entries) {
      if (entry.kind === 'row') {
        page.drawText(entry.leftLabel, {
          x: boxLeft + padX,
          y: y - 8,
          size: 7,
          font: timesBold,
          color: slate,
        });
        page.drawText(entry.leftValue, {
          x: boxLeft + padX + 28,
          y: y - 8,
          size: 10,
          font: times,
          color: filledGreen,
        });
        if (entry.rightLabel) {
          page.drawText(entry.rightLabel, {
            x: boxLeft + boxW * 0.55,
            y: y - 8,
            size: 7,
            font: timesBold,
            color: slate,
          });
          page.drawText(entry.rightValue, {
            x: boxLeft + boxW * 0.55 + 32,
            y: y - 8,
            size: 10,
            font: times,
            color: filledGreen,
          });
        }
        y -= 22;
      } else {
        page.drawText(entry.label, {
          x: boxLeft + padX,
          y: y - 8,
          size: 7,
          font: timesBold,
          color: slate,
        });
        page.drawText(entry.value, {
          x: boxLeft + padX,
          y: y - 22,
          size: 11,
          font: times,
          color: filledGreen,
        });
        y -= 36;
      }
    }
  };

  // --- Patient / provider row ---
  const infoLabelTop = yCursor;
  const colW = (CONTENT_W - 12) / 2;
  const providerLeft = MARGIN_L + colW + 12;

  drawSectionLabel('PATIENT', infoLabelTop);
  drawSectionLabel('ORDERING PROVIDER', infoLabelTop, providerLeft);

  yCursor -= 12;
  const infoBoxH = 96;
  const infoBoxTop = yCursor;

  drawBoxTop(MARGIN_L, infoBoxTop, colW, infoBoxH);
  drawInBox(
    [
      { kind: 'value', label: 'NAME', value: 'Jordan A. Whitmore' },
      {
        kind: 'row',
        leftLabel: 'DOB',
        leftValue: '11/03/1988',
        rightLabel: 'MRN',
        rightValue: 'MRN-440921',
      },
    ],
    infoBoxTop,
    MARGIN_L,
    colW,
    infoBoxH,
  );

  drawBoxTop(providerLeft, infoBoxTop, colW, infoBoxH);
  drawInBox(
    [
      { kind: 'value', label: 'NAME', value: 'Dr. Elena Vasquez' },
      {
        kind: 'row',
        leftLabel: 'NPI',
        leftValue: '1629384750',
        rightLabel: 'SITE',
        rightValue: 'Riverside Clinic',
      },
    ],
    infoBoxTop,
    providerLeft,
    colW,
    infoBoxH,
  );

  yCursor = infoBoxTop - infoBoxH - GAP;

  // --- Collection row ---
  drawSectionLabel('COLLECTION', yCursor);
  yCursor -= 12;
  const collectionH = 32;
  const collectionTop = yCursor;
  drawBoxTop(MARGIN_L, collectionTop, CONTENT_W, collectionH, white);
  page.drawText('DATE / TIME', {
    x: MARGIN_L + 8,
    y: collectionTop - 20,
    size: 7,
    font: timesBold,
    color: slate,
  });
  page.drawText('05/21/2026  08:15 AM', {
    x: MARGIN_L + 72,
    y: collectionTop - 20,
    size: 10,
    font: times,
    color: filledGreen,
  });
  page.drawText('FASTING', {
    x: 360,
    y: collectionTop - 20,
    size: 7,
    font: timesBold,
    color: slate,
  });
  page.drawText('[X] Yes   [ ] No', {
    x: 410,
    y: collectionTop - 20,
    size: 10,
    font: times,
    color: filledGreen,
  });

  yCursor = collectionTop - collectionH - GAP;

  // --- Tests table ---
  drawSectionLabel('TESTS ORDERED', yCursor);
  yCursor -= 12;
  const rowH = 24;
  const cptColW = 88;
  const nameColW = CONTENT_W - cptColW;

  page.drawText('TEST', {
    x: MARGIN_L + 8,
    y: yCursor - 9,
    size: 7,
    font: timesBold,
    color: muted,
  });
  page.drawText('CPT', {
    x: MARGIN_L + nameColW + 8,
    y: yCursor - 9,
    size: 7,
    font: timesBold,
    color: muted,
  });
  yCursor -= 14;

  const tests = [
    ['CBC with differential', '85025'],
    ['Comprehensive metabolic panel', '80053'],
    ['HbA1c', '83036'],
    ['Lipid panel', '80061'],
  ];

  for (const [name, cpt] of tests) {
    const rowTop = yCursor;
    drawBoxTop(MARGIN_L, rowTop, CONTENT_W, rowH, white);
    page.drawLine({
      start: { x: MARGIN_L + nameColW, y: rowTop - rowH },
      end: { x: MARGIN_L + nameColW, y: rowTop },
      thickness: 0.75,
      color: border,
    });
    page.drawText(name, {
      x: MARGIN_L + 8,
      y: rowTop - 16,
      size: 10,
      font: times,
      color: filledGreen,
    });
    page.drawText(cpt, {
      x: MARGIN_L + nameColW + 8,
      y: rowTop - 16,
      size: 10,
      font: times,
      color: filledGreen,
    });
    yCursor = rowTop - rowH - 4;
  }

  yCursor -= GAP - 4;

  // --- Clinical indication ---
  drawSectionLabel('CLINICAL INDICATION', yCursor);
  yCursor -= 12;
  const clinicalH = 64;
  const clinicalTop = yCursor;
  drawBoxTop(MARGIN_L, clinicalTop, CONTENT_W, clinicalH, white);
  page.drawText(
    'Annual wellness visit. Monitor glycemic control and lipid profile.',
    { x: MARGIN_L + 8, y: clinicalTop - 22, size: 10, font: times, color: filledGreen },
  );
  page.drawText('ICD-10: Z00.00, E11.9', {
    x: MARGIN_L + 8,
    y: clinicalTop - 38,
    size: 10,
    font: times,
    color: filledGreen,
  });

  yCursor = clinicalTop - clinicalH - GAP;

  drawSectionLabel('PRIORITY', yCursor);
  page.drawText('[ ] STAT   [X] Routine   [ ] Timed draw', {
    x: MARGIN_L,
    y: yCursor - 24,
    size: 10,
    font: times,
    color: filledGreen,
  });

  yCursor -= 40;

  // --- Footer: rule, then boxes with labels inside (avoids border crossing text) ---
  page.drawLine({
    start: { x: MARGIN_L, y: yCursor },
    end: { x: PAGE_W - MARGIN_R, y: yCursor },
    thickness: 0.5,
    color: border,
  });

  yCursor -= GAP;
  const footerBoxH = 40;
  const footerBoxTop = yCursor;
  const dateReceivedLeft = MARGIN_L + 344;
  const footerLabelY = footerBoxTop - 14;

  drawBoxTop(MARGIN_L, footerBoxTop, 140, footerBoxH, white);
  drawSectionLabelBaseline('PHLEBOTOMIST INITIALS', footerLabelY, MARGIN_L + 8);

  drawBoxTop(dateReceivedLeft, footerBoxTop, CONTENT_W - 344, footerBoxH, white);
  drawSectionLabelBaseline('DATE RECEIVED', footerLabelY, dateReceivedLeft + 8);

  page.drawText(
    'Specimens must be labeled at bedside. Reject hemolyzed samples per lab policy §4.2.',
    { x: MARGIN_L, y: 48, size: 7.5, font: times, color: muted },
  );

  const bytes = await doc.save();
  writeFileSync(OUT_PATH, bytes);
  writeFileSync(PRIOR_AUTH_PATH, bytes);
  console.log(`Generated: ${OUT_PATH} (${bytes.length} bytes)`);
  console.log(`Generated: ${PRIOR_AUTH_PATH} (${bytes.length} bytes)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
