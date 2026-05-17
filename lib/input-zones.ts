// lib/input-zones.ts
import type { InputZone, PdfKey } from './types';

export const PRIOR_AUTH_ZONES: InputZone[] = [
  { fieldId: 'patient_name',     page: 1, x: 42,  y: 632, width: 320, height: 16, fontSize: 11 },
  { fieldId: 'dob',              page: 1, x: 354,  y: 632, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'member_id',        page: 1, x: 42,  y: 604, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'group_number',     page: 1, x: 244,  y: 604, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'icd10',            page: 1, x: 42,  y: 528, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'service_date',     page: 1, x: 42,  y: 472, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'place_of_service', page: 1, x: 414,  y: 472, width: 160, height: 16, fontSize: 11 },
  { fieldId: 'urgency',          page: 1, x: 42,  y: 432, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'provider',         page: 1, x: 42,  y: 372, width: 320, height: 16, fontSize: 11 },
];

export const REFERRAL_ZONES: InputZone[] = [
  { fieldId: 'patient_name',        page: 1, x: 42,  y: 661, width: 300, height: 16, fontSize: 11 },
  { fieldId: 'dob',                 page: 1, x: 380,  y: 661, width: 190, height: 16, fontSize: 11 },
  { fieldId: 'insurance_id',        page: 1, x: 42,  y: 627, width: 280, height: 16, fontSize: 11 },
  { fieldId: 'referring_provider',  page: 1, x: 42,  y: 563, width: 300, height: 16, fontSize: 11 },
  { fieldId: 'referring_npi',       page: 1, x: 380,  y: 563, width: 190, height: 16, fontSize: 11 },
  { fieldId: 'specialty',           page: 1, x: 42,  y: 529, width: 300, height: 16, fontSize: 11 },
  { fieldId: 'urgency',             page: 1, x: 42,  y: 465, width: 280, height: 16, fontSize: 11 },
  { fieldId: 'diagnosis',           page: 1, x: 42,  y: 431, width: 250, height: 16, fontSize: 11 },
  { fieldId: 'clinical_notes',      page: 1, x: 42,  y: 397, width: 530, height: 16, fontSize: 11 },
];

export function zonesForPdf(pdfKey: PdfKey): InputZone[] {
  return pdfKey === 'referral' ? REFERRAL_ZONES : PRIOR_AUTH_ZONES;
}

export function zoneForField(fieldId: string, pdfKey: PdfKey = 'prior-auth'): InputZone | undefined {
  return zonesForPdf(pdfKey).find((z) => z.fieldId === fieldId);
}
