// lib/pdf-stamp.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { zoneForField } from './input-zones';
import type { PdfKey } from './types';

export interface StampField {
  id: string;
  value: string;
  type: 'text' | 'checkbox';
}

export async function stampFields(
  sourcePdf: Uint8Array | Buffer,
  fields: StampField[],
  pdfKey: PdfKey = 'prior-auth',
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(sourcePdf);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const f of fields) {
    const zone = zoneForField(f.id, pdfKey);
    if (!zone) continue;
    const page = doc.getPage(zone.page - 1);

    if (f.type === 'checkbox') {
      if (f.value && f.value.toLowerCase() !== 'unchecked' && f.value.toLowerCase() !== 'false') {
        page.drawText('X', {
          x: zone.x,
          y: zone.y,
          size: zone.fontSize + 1,
          font: helvBold,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
      continue;
    }

    const maxChars = Math.floor(zone.width / (zone.fontSize * 0.55));
    const text = f.value.length > maxChars ? f.value.slice(0, maxChars - 1) + '…' : f.value;

    page.drawText(text, {
      x: zone.x,
      y: zone.y,
      size: zone.fontSize,
      font: helv,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  return doc.save();
}
