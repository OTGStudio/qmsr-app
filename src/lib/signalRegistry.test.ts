import { describe, expect, it } from 'vitest';

import { PRESETS } from '@/lib/domain';
import {
  normalizeSignal,
  normalizeSignals,
  signalLabel,
} from '@/lib/signalRegistry';

describe('signalRegistry', () => {
  it('normalizes canonical label to key', () => {
    const n = normalizeSignal('MDR increase');
    expect(n.matched).toBe(true);
    expect(n.key).toBe('mdr_increase');
    expect(n.normalizedLabel).toBe('MDR increase');
  });

  it('normalizes alias text', () => {
    const n = normalizeSignal('mdr');
    expect(n.matched).toBe(true);
    expect(n.key).toBe('mdr_increase');
  });

  it('rejects unknown custom text', () => {
    const n = normalizeSignal('my random worry');
    expect(n.matched).toBe(false);
  });

  it('normalizeSignals splits canonical vs rejected', () => {
    const r = normalizeSignals(['Complaint trend', 'not a real signal', 'MDR increase']);
    expect(r.canonical).toContain('complaint_trend');
    expect(r.canonical).toContain('mdr_increase');
    expect(r.rejected).toContain('not a real signal');
  });

  it('every preset resolves only to canonical keys', () => {
    for (const preset of Object.values(PRESETS)) {
      for (const k of preset.signals) {
        expect(signalLabel(k).length).toBeGreaterThan(0);
      }
    }
  });
});
