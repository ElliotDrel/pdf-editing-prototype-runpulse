// tests/input-zones.test.ts
import { describe, expect, it } from 'vitest';
import { PRIOR_AUTH_ZONES, REFERRAL_ZONES, zoneForField, zonesForPdf } from '@/lib/input-zones';

describe('input zones', () => {
  it('has a zone for every prior-auth field id', () => {
    const ids = ['patient_name', 'dob', 'member_id', 'group_number', 'service_date', 'place_of_service', 'urgency', 'icd10', 'provider'];
    for (const id of ids) {
      expect(zoneForField(id, 'prior-auth'), `missing zone for ${id}`).toBeDefined();
    }
  });

  it('has a zone for every referral field id', () => {
    const ids = ['patient_name', 'dob', 'insurance_id', 'referring_provider', 'referring_npi', 'specialty', 'urgency', 'diagnosis', 'clinical_notes'];
    for (const id of ids) {
      expect(zoneForField(id, 'referral'), `missing referral zone for ${id}`).toBeDefined();
    }
  });

  it('prior-auth zones are within Letter page bounds', () => {
    for (const z of PRIOR_AUTH_ZONES) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.x + z.width).toBeLessThanOrEqual(612);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.y + z.height).toBeLessThanOrEqual(792);
    }
  });

  it('referral zones are within Letter page bounds', () => {
    for (const z of REFERRAL_ZONES) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.x + z.width).toBeLessThanOrEqual(612);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.y + z.height).toBeLessThanOrEqual(792);
    }
  });

  it('zones use sensible font size', () => {
    for (const z of [...PRIOR_AUTH_ZONES, ...REFERRAL_ZONES]) {
      expect(z.fontSize).toBeGreaterThanOrEqual(8);
      expect(z.fontSize).toBeLessThanOrEqual(14);
    }
  });

  it('zonesForPdf returns correct set', () => {
    expect(zonesForPdf('prior-auth')).toBe(PRIOR_AUTH_ZONES);
    expect(zonesForPdf('referral')).toBe(REFERRAL_ZONES);
  });
});
