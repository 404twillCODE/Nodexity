import { describe, it, expect } from 'vitest';
import { getLogLevel, lineHasServerTimestamp } from './consoleUtils';

describe('getLogLevel', () => {
  it('detects ERROR level', () => {
    expect(getLogLevel('[14:30:00 ERROR]: Something broke')).toBe('error');
    expect(getLogLevel('java.lang.Exception: failure')).toBe('error');
    expect(getLogLevel('FATAL error occurred')).toBe('error');
    expect(getLogLevel('Error: connection refused')).toBe('error');
  });

  it('detects WARN level', () => {
    expect(getLogLevel('[14:30:00 WARN]: Deprecated API')).toBe('warn');
    expect(getLogLevel('WARNING: low memory')).toBe('warn');
    expect(getLogLevel('*** Warning: something')).toBe('warn');
  });

  it('detects INFO level', () => {
    expect(getLogLevel('[14:30:00 INFO]: Server started')).toBe('info');
    expect(getLogLevel('[INFO] Done!')).toBe('info');
  });

  it('returns null for unrecognized lines', () => {
    expect(getLogLevel('Just some plain text')).toBeNull();
    expect(getLogLevel('')).toBeNull();
    expect(getLogLevel('Loading plugins...')).toBeNull();
  });

  it('ERROR takes priority over WARN/INFO in same line', () => {
    expect(getLogLevel('[INFO] ERROR occurred')).toBe('error');
    expect(getLogLevel('[WARN] Exception thrown')).toBe('error');
  });
});

describe('lineHasServerTimestamp', () => {
  it('detects [HH:MM:SS] timestamps', () => {
    expect(lineHasServerTimestamp('[14:30:00] Server started')).toBe(true);
    expect(lineHasServerTimestamp('[9:05:12] Done')).toBe(true);
  });

  it('detects [HH:MM:SS LEVEL]: timestamps', () => {
    expect(lineHasServerTimestamp('[14:30:00 INFO]: Ready')).toBe(true);
    expect(lineHasServerTimestamp('[14:30:00 WARN]: Deprecated')).toBe(true);
  });

  it('detects [HH:MM] timestamps (no seconds)', () => {
    expect(lineHasServerTimestamp('[14:30] Some message')).toBe(true);
  });

  it('allows leading whitespace', () => {
    expect(lineHasServerTimestamp('  [14:30:00] Indented')).toBe(true);
  });

  it('rejects lines without timestamps', () => {
    expect(lineHasServerTimestamp('No timestamp here')).toBe(false);
    expect(lineHasServerTimestamp('')).toBe(false);
    expect(lineHasServerTimestamp('Starting server...')).toBe(false);
  });
});
