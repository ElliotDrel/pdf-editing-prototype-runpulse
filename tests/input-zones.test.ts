// tests/input-zones.test.ts
import { describe, expect, it } from 'vitest';
import { INPUT_ZONES, zoneForField } from '@/lib/input-zones';

describe('input zones', () => {
  it('has a zone for every demo field id', () => {
    const ids = ['patient_name', 'dob', 'member_id', 'group_number', 'service_date', 'place_of_service', 'urgency', 'icd10', 'provider'];
    for (const id of ids) {
      expect(zoneForField(id), `missing zone for ${id}`).toBeDefined();
    }
  });

  it('zones are within Letter page bounds', () => {
    for (const z of INPUT_ZONES) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.x + z.width).toBeLessThanOrEqual(612);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.y + z.height).toBeLessThanOrEqual(792);
    }
  });

  it('zones use sensible font size', () => {
    for (const z of INPUT_ZONES) {
      expect(z.fontSize).toBeGreaterThanOrEqual(8);
      expect(z.fontSize).toBeLessThanOrEqual(14);
    }
  });
});
