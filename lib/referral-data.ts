// lib/referral-data.ts
import type { Field } from './types';

export const REFERRAL_FIELDS: Field[] = [
  { id: 'patient_name',       label: 'Patient Name',               value: 'Marcus T. Rivera',                                  confidence: 0.97, tier: 'high', source: 'OCR',      type: 'text',     needsReview: false, reviewed: true },
  { id: 'dob',                label: 'Date of Birth',              value: '07/22/1979',                                        confidence: 0.96, tier: 'high', source: 'Layout',    type: 'text',     needsReview: false, reviewed: true },
  { id: 'insurance_id',       label: 'Insurance ID',               value: 'UHC-5521-0093',                                     confidence: 0.95, tier: 'high', source: 'OCR',      type: 'text',     needsReview: false, reviewed: true },
  { id: 'referring_provider', label: 'Referring Provider',         value: 'Dr. Sarah L. Kim',                                  confidence: 0.93, tier: 'high', source: 'OCR',      type: 'text',     needsReview: false, reviewed: true },
  { id: 'referring_npi',      label: 'NPI',                        value: '1298374650',                                        confidence: 0.91, tier: 'high', source: 'OCR',      type: 'text',     needsReview: false, reviewed: true },
  { id: 'specialty',          label: 'Specialty Requested',        value: 'Endocrinology',                                     confidence: 0.92, tier: 'high', source: 'VLM',      type: 'text',     needsReview: false, reviewed: true },
  { id: 'urgency',            label: 'Urgency',                    value: 'Semi-urgent',                                       confidence: 0.88, tier: 'high', source: 'Checkbox',  type: 'checkbox', needsReview: false, reviewed: true },
  { id: 'diagnosis',          label: 'Primary Diagnosis (ICD-10)', value: 'E11.65', confidence: 0.78, tier: 'mid', source: 'VLM', flag: 'Code matched from visit notes. Confirm primary vs. secondary: E11.65 = Type 2 diabetes with hypoglycemia.',        type: 'text', needsReview: true, reviewed: false },
  { id: 'clinical_notes',     label: 'Clinical Notes',             value: 'Uncontrolled T2DM, eval for insulin therapy',       confidence: 0.61, tier: 'low', source: 'OCR',       flag: 'Partial text detected. Original notes may include additional context not captured.',                                    type: 'text', needsReview: true, reviewed: false },
];
