// scripts/test-form-fill.mjs
// Tests /form/clear → /form/fill with structured form_fields (coordinate-based)
// against the referral PDF.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PULSE_API_KEY;
const BASE = process.env.PULSE_BASE_URL ?? 'https://api.runpulse.com';
const PAGE_W = 612;
const PAGE_H = 792;

if (!API_KEY) {
  console.error('PULSE_API_KEY not set');
  process.exit(1);
}

// Referral input zones (PDF points, bottom-left origin)
const REFERRAL_ZONES = [
  { fieldId: 'patient_name',       page: 1, x: 42,  y: 661, width: 300, height: 16 },
  { fieldId: 'dob',                page: 1, x: 380, y: 661, width: 190, height: 16 },
  { fieldId: 'insurance_id',       page: 1, x: 42,  y: 627, width: 280, height: 16 },
  { fieldId: 'referring_provider', page: 1, x: 42,  y: 563, width: 300, height: 16 },
  { fieldId: 'referring_npi',      page: 1, x: 380, y: 563, width: 190, height: 16 },
  { fieldId: 'specialty',          page: 1, x: 42,  y: 529, width: 300, height: 16 },
  { fieldId: 'urgency',            page: 1, x: 42,  y: 465, width: 280, height: 16 },
  { fieldId: 'diagnosis',          page: 1, x: 42,  y: 431, width: 250, height: 16 },
  { fieldId: 'clinical_notes',     page: 1, x: 42,  y: 397, width: 530, height: 16 },
];

// Test values to fill
const TEST_VALUES = {
  patient_name:       'Margaret O. Chen',
  dob:                '03/14/1962',
  insurance_id:       'BCX-881-2241',
  referring_provider: 'Dr. James Alvarez',
  referring_npi:      '1234567890',
  specialty:          'Cardiology',
  urgency:            'Routine',
  diagnosis:          'Z87.891 — Hx of nicotine dependence',
  clinical_notes:     'Patient presents with persistent cough; refer for pulmonary eval.',
};

// Convert PDF points (bottom-left origin) → normalized [x1, y1, x2, y2] (top-left origin)
function toNormBbox(zone) {
  const x1 = zone.x / PAGE_W;
  const y1 = 1 - (zone.y + zone.height) / PAGE_H;
  const x2 = (zone.x + zone.width) / PAGE_W;
  const y2 = 1 - zone.y / PAGE_H;
  return [x1, y1, x2, y2];
}

function buildFormFields() {
  return REFERRAL_ZONES.map((zone) => ({
    text: TEST_VALUES[zone.fieldId] ?? '',
    page_number: zone.page,
    bounding_box: toNormBbox(zone),
    type: 'text',
  }));
}

function buildInstructions() {
  return 'Fill out this form with:\n' +
    Object.entries(TEST_VALUES)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}.`)
      .join('\n');
}

async function clearPdf(pdfBytes) {
  console.log('→ POST /form/clear ...');
  const fd = new FormData();
  fd.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'sample.pdf');
  const res = await fetch(`${BASE}/form/clear`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`/form/clear failed: ${res.status} ${t}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = await res.json();
    console.log('  clear response (JSON):', body);
    if (body.pdf_url) {
      const r2 = await fetch(body.pdf_url, { headers: { 'x-api-key': API_KEY } });
      return new Uint8Array(await r2.arrayBuffer());
    }
    throw new Error('clear: missing pdf_url in JSON response');
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function fillPdf(clearedBytes, formFields, instructions) {
  console.log('→ POST /form/fill with form_fields ...');
  console.log('  form_fields sample:', JSON.stringify(formFields[0], null, 2));
  const fd = new FormData();
  fd.append('file', new Blob([clearedBytes], { type: 'application/pdf' }), 'cleared.pdf');
  fd.append('instructions', instructions);
  fd.append('form_fields', JSON.stringify(formFields));
  const res = await fetch(`${BASE}/form/fill`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`/form/fill failed: ${res.status} ${t}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  console.log('  fill response content-type:', ct);
  if (ct.includes('application/json')) {
    const body = await res.json();
    console.log('  fill response (JSON):', body);
    if (body.pdf_url) {
      const r2 = await fetch(body.pdf_url, { headers: { 'x-api-key': API_KEY } });
      return new Uint8Array(await r2.arrayBuffer());
    }
    throw new Error('fill: missing pdf_url in JSON response');
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function main() {
  const pdfPath = resolve(__dir, '../public/sample-referral.pdf');
  const pdfBytes = new Uint8Array(readFileSync(pdfPath));
  console.log(`PDF size: ${pdfBytes.length} bytes`);

  const cleared = await clearPdf(pdfBytes);
  console.log(`  cleared PDF: ${cleared.length} bytes`);

  const formFields = buildFormFields();
  const instructions = buildInstructions();
  const filled = await fillPdf(cleared, formFields, instructions);
  console.log(`  filled PDF: ${filled.length} bytes`);

  const outPath = resolve(__dir, '../public/test-fill-output.pdf');
  writeFileSync(outPath, filled);
  console.log(`✓ saved to public/test-fill-output.pdf`);
}

main().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
