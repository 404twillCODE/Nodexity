/** Detect log level from line content for color coding (ERROR, WARN, INFO, etc.) */
export function getLogLevel(text: string): 'error' | 'warn' | 'info' | null {
  const t = text;
  if (/\bERROR\b|\[ERROR\]|Error:|Exception|FATAL/i.test(t)) return 'error';
  if (/\bWARN(ING)?\b|\[WARN\]|Warning|^\s*\*\*\* Warning/i.test(t)) return 'warn';
  if (/\bINFO\b|\[INFO\]/i.test(t)) return 'info';
  return null;
}

/** Line already has a timestamp (e.g. [14:14:46] or [14:14:46 INFO]:) - don't duplicate */
export function lineHasServerTimestamp(text: string): boolean {
  return /^\s*\[\d{1,2}:\d{2}(:\d{2})?(\s+[A-Z]+)?\]/.test(text);
}
