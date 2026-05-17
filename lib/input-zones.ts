// lib/input-zones.ts
import type { InputZone } from './types';

export const INPUT_ZONES: InputZone[] = [
  { fieldId: 'patient_name',     page: 1, x: 42, y: 632, width: 320, height: 16, fontSize: 11 },
  { fieldId: 'dob',              page: 1, x: 354, y: 632, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'member_id',        page: 1, x: 42, y: 604, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'group_number',     page: 1, x: 244, y: 604, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'icd10',            page: 1, x: 42, y: 528, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'service_date',     page: 1, x: 42, y: 472, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'place_of_service', page: 1, x: 414, y: 472, width: 160, height: 16, fontSize: 11 },
  { fieldId: 'urgency',          page: 1, x: 42, y: 432, width: 200, height: 16, fontSize: 11 },
  { fieldId: 'provider',         page: 1, x: 42, y: 372, width: 320, height: 16, fontSize: 11 },
];

export function zoneForField(fieldId: string): InputZone | undefined {
  return INPUT_ZONES.find((z) => z.fieldId === fieldId);
}
