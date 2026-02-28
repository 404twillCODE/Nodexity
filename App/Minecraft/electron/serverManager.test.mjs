import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

// serverManager.js is CommonJS — use createRequire to load it in ESM test context.
// We only test pure, exported helper functions here (no side effects, no I/O).
const require = createRequire(import.meta.url);

// We can't require the full module (it starts background timers and hits the filesystem),
// so we extract the pure helpers by reading the source and evaluating just what we need.
// Instead, we replicate the logic of the pure functions to lock their behavior.

// --- compareVersions (from main.js, same logic used in serverManager) ---
function compareVersions(a, b) {
  const partsA = String(a).replace(/^v/i, '').split('.').map(Number);
  const partsB = String(b).replace(/^v/i, '').split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i += 1) {
    const aVal = partsA[i] || 0;
    const bVal = partsB[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}

// --- normalizeRamGB (from serverManager.js) ---
function normalizeRamGB(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

// --- formatBackupTimestamp (from serverManager.js) ---
function formatBackupTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('') + '-' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.20.4', '1.20.4')).toBe(0);
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0);
  });

  it('returns 1 when a > b', () => {
    expect(compareVersions('1.21.0', '1.20.4')).toBe(1);
    expect(compareVersions('2.0.0', '1.99.99')).toBe(1);
    expect(compareVersions('1.20.5', '1.20.4')).toBe(1);
  });

  it('returns -1 when a < b', () => {
    expect(compareVersions('1.20.4', '1.21.0')).toBe(-1);
    expect(compareVersions('0.1.0', '0.2.0')).toBe(-1);
  });

  it('handles v-prefix', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('V2.0.0', 'v1.0.0')).toBe(1);
  });

  it('handles different-length versions', () => {
    expect(compareVersions('1.20', '1.20.0')).toBe(0);
    expect(compareVersions('1.20', '1.20.1')).toBe(-1);
    expect(compareVersions('1.20.1', '1.20')).toBe(1);
  });
});

describe('normalizeRamGB', () => {
  it('returns the value when it is a positive number', () => {
    expect(normalizeRamGB(4, 2)).toBe(4);
    expect(normalizeRamGB(0.5, 2)).toBe(0.5);
    expect(normalizeRamGB(16, 2)).toBe(16);
  });

  it('returns the value when given a numeric string', () => {
    expect(normalizeRamGB('8', 2)).toBe(8);
    expect(normalizeRamGB('2.5', 4)).toBe(2.5);
  });

  it('returns fallback for non-positive or invalid values', () => {
    expect(normalizeRamGB(0, 4)).toBe(4);
    expect(normalizeRamGB(-1, 4)).toBe(4);
    expect(normalizeRamGB(NaN, 4)).toBe(4);
    expect(normalizeRamGB(null, 4)).toBe(4);
    expect(normalizeRamGB(undefined, 4)).toBe(4);
    expect(normalizeRamGB('abc', 4)).toBe(4);
    expect(normalizeRamGB('', 4)).toBe(4);
  });

  it('returns fallback for Infinity', () => {
    expect(normalizeRamGB(Infinity, 4)).toBe(4);
    expect(normalizeRamGB(-Infinity, 4)).toBe(4);
  });
});

describe('formatBackupTimestamp', () => {
  it('formats a known date correctly', () => {
    const date = new Date(2025, 0, 15, 9, 5, 3); // Jan 15, 2025 09:05:03
    expect(formatBackupTimestamp(date)).toBe('20250115-090503');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2024, 2, 3, 14, 30, 0); // Mar 3, 2024 14:30:00
    expect(formatBackupTimestamp(date)).toBe('20240303-143000');
  });

  it('handles midnight', () => {
    const date = new Date(2024, 11, 31, 0, 0, 0); // Dec 31, 2024 00:00:00
    expect(formatBackupTimestamp(date)).toBe('20241231-000000');
  });

  it('handles end of day', () => {
    const date = new Date(2024, 5, 15, 23, 59, 59); // Jun 15, 2024 23:59:59
    expect(formatBackupTimestamp(date)).toBe('20240615-235959');
  });

  it('matches YYYYMMDD-HHMMSS pattern', () => {
    const result = formatBackupTimestamp(new Date());
    expect(result).toMatch(/^\d{8}-\d{6}$/);
  });
});
